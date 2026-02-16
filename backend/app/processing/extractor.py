import io, fitz, docx, pandas as pd, pptx
import json
import logging
# Eliminamos pdfplumber si da problemas en Alpine, fitz (PyMuPDF) es mejor

def _get_file_type(filename: str, content_type: str) -> str:
        content_type_map = {
            "application/pdf": "pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
            "application/msword": "docx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
            "application/vnd.ms-excel": "xls",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
            "application/vnd.ms-powerpoint": "pptx",
            "text/plain": "txt",
            "text/csv": "txt", 
            "application/x-ipynb+json": "ipynb",
            "text/markdown": "txt",
            "text/x-python": "txt",
            "text/javascript": "txt",
            "text/typescript": "txt",
            "application/json": "txt",
            "text/html": "txt",
            "text/css": "txt",
            "text/xml": "txt",
        }
        
        if content_type in content_type_map:
            return content_type_map[content_type]
        
        if content_type.startswith("text/") or content_type == "application/octet-stream":
            extension = filename.split('.')[-1].lower()
            extension_map = {
                "pdf": "pdf", "docx": "docx", "txt": "txt",
                "xlsx": "xlsx", "xls": "xls", "pptx": "pptx",
                "ppt": "pptx", "csv": "txt", "md": "txt", "py": "txt", "js": "txt",
                "tsx": "txt", "json": "txt", "html": "txt", "css": "txt", "xml": "txt",
                "ipynb": "ipynb",
            }
            return extension_map.get(extension, "unsupported")
            
        return "unsupported"
    
def _extract_text_from_content(content: bytes, content_type: str, filename: str) -> str:
        file_type = _get_file_type(filename, content_type)
        logging.info(f"[INFO] Extractor: Archivo '{filename}' detectado como '{file_type}'")

        try:
            if file_type == "pdf":
                with fitz.open(stream=content, filetype="pdf") as doc:
                    return "\n".join(page.get_text() for page in doc)
            
            elif file_type == "docx":
                docx_file = io.BytesIO(content)
                doc = docx.Document(docx_file)
                return "\n".join([p.text for p in doc.paragraphs])
            
            elif file_type in ["xlsx", "xls"]:
                excel_file = io.BytesIO(content)
                xls = pd.read_excel(excel_file, sheet_name=None)
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
                # Intentar decodificar con utf-8, fallback a latin-1
                try:
                    return content.decode('utf-8')
                except UnicodeDecodeError:
                    return content.decode('latin-1')
                
            elif file_type == "ipynb":
                try:
                    notebook = json.loads(content.decode('utf-8'))
                    text_output = []
                    for cell in notebook.get('cells', []):
                        cell_type = cell.get('cell_type', '')
                        source = "".join(cell.get('source', []))
                        
                        if cell_type == 'markdown':
                            text_output.append(f"--- [MARKDOWN] ---\n{source}")
                        elif cell_type == 'code':
                            text_output.append(f"--- [CODE] ---\n{source}")
                            # Opcional: Extraer outputs de texto
                            for output in cell.get('outputs', []):
                                if 'text' in output:
                                    out_text = "".join(output['text'])
                                    text_output.append(f"--- [OUTPUT] ---\n{out_text}")
                    return "\n\n".join(text_output)
                except Exception as e:
                    logging.error(f"Error parseando ipynb: {e}")
                    return content.decode('utf-8', errors='ignore')

            else:
                logging.warning(f"[WARNING] Tipo no soportado: {file_type}")
                return "" # Retornar vacío en lugar de mensaje de error para manejarlo mejor arriba
        except Exception as e:
            logging.error(f"[ERROR] Excepción extrayendo texto: {e}")
            raise e # Relanzar para que el servicio capture el error real