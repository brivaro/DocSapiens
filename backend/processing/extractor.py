# backend/processing/extractor.py
import io, fitz, pdfplumber, docx, pandas as pd, pptx

def _get_file_type(filename: str, content_type: str) -> str:
        # Mapeo de content_types conocidos a tipos simples
        content_type_map = {
            "application/pdf": "pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
            "application/msword": "docx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
            "application/vnd.ms-excel": "xls",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
            "application/vnd.ms-powerpoint": "pptx",
            "text/plain": "txt",
            "text/csv": "txt",  # CSV se trata como texto
            #"text/csv": "csv"
        }
        
        # Si el content_type es específico, lo usamos
        if content_type in content_type_map:
            return content_type_map[content_type]
        
        # Si es genérico (como octet-stream) o texto, miramos la extensión
        if content_type.startswith("text/") or content_type == "application/octet-stream":
            extension = filename.split('.')[-1].lower()
            extension_map = {
                "pdf": "pdf", "docx": "docx", "txt": "txt",
                "xlsx": "xlsx", "xls": "xls", "pptx": "pptx",
                "ppt": "pptx", "csv": "txt"
            }
            return extension_map.get(extension, "unsupported")
            
        return "unsupported"
    
def _extract_text_from_content(content: bytes, content_type: str, filename: str) -> str:
        file_type = _get_file_type(filename, content_type)
        print(f"[INFO] Tipo de archivo determinado como: {file_type}")

        try:
            if file_type == "pdf":
                try:
                    with fitz.open(stream=content, filetype="pdf") as doc:
                        return "\n".join(page.get_text() for page in doc)
                except Exception:
                    with pdfplumber.open(io.BytesIO(content)) as pdf:
                        return "\n".join(page.extract_text() or "" for page in pdf.pages)
            
            elif file_type == "docx":
                docx_file = io.BytesIO(content)
                doc = docx.Document(docx_file)
                return "\n".join([p.text for p in doc.paragraphs])
            
            elif file_type in ["xlsx", "xls"]:
                excel_file = io.BytesIO(content)
                xls = pd.read_excel(excel_file, sheet_name=None, engine='openpyxl' if file_type == 'xlsx' else 'xlrd')
                full_text = []
                for sheet_name, df in xls.items():
                    full_text.append(f"--- Hoja: {sheet_name} ---\n")
                    full_text.append(df.to_string(index=False))
                return "\n\n".join(full_text)

            elif file_type == "pptx":
                ppt_file = io.BytesIO(content)
                presentation = pptx.Presentation(ppt_file)
                full_text = []
                for slide in presentation.slides:
                    for shape in slide.shapes:
                        if hasattr(shape, "text"):
                            full_text.append(shape.text)
                return "\n".join(full_text)

            elif file_type == "txt":
                return content.decode(errors="ignore")
            
            elif file_type == "csv": # De momento no se usa, me gusta que vaya por txt
                csv_file = io.BytesIO(content)
                df = pd.read_csv(csv_file)
                return df.to_string(index=False)

            else: # file_type == "unsupported"
                print(f"[WARNING] Tipo de archivo no soportado '{content_type}' para el archivo '{filename}'. No se extraerá texto.")
                return "[Unsupported file type for text extraction]"
        except Exception as e:
            print(f"[ERROR] No se pudo extraer texto del archivo '{filename}' (tipo: {file_type}). Error: {e}")
            return f"[Error extracting text: {e}]"