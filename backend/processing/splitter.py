from typing import List
from backend.processing.extractor import _get_file_type
import io, fitz, pandas as pd, pptx
from backend.models.document import DocumentChunk, DocumentCreate

def _split_text(text: str, doc_id: str, doc_model: DocumentCreate) -> List[DocumentChunk]:
        split_mode = doc_model.split_mode
        split_by = doc_model.split_by
        chunk_size = doc_model.chunk_size
        overlap = doc_model.overlap
        content_type = doc_model.content_type
        raw_content = doc_model.content
        filename = doc_model.filename

        chunks = []
        pos = 0
        idx = 0

        if split_mode == "pages":
            file_type = _get_file_type(filename, content_type)
            print(f"[INFO] Dividiendo por páginas para el tipo de archivo: {file_type}")

            try:
                # Caso 1: PDF (cada página es un chunk)
                if file_type == "pdf":
                    with fitz.open(stream=raw_content, filetype="pdf") as doc:
                        for page_num, page in enumerate(doc):
                            page_text = page.get_text("text")
                            if page_text.strip():
                                chunks.append(
                                    create_chunk_to_list(doc_id, idx, page_text, 0, 0, split_mode, file_type, page_num)
                                )
                                idx += 1
                    return chunks

                # Caso 2: Excel (cada hoja es un chunk)
                elif file_type in ["xlsx", "xls"]:
                    excel_file = io.BytesIO(raw_content)
                    xls = pd.read_excel(excel_file, sheet_name=None, engine='openpyxl' if file_type == 'xlsx' else 'xlrd')
                    for sheet_name, df in xls.items():
                        sheet_text = df.to_string(index=False)
                        if sheet_text.strip():
                            chunks.append(
                                create_chunk_to_list(doc_id, idx, sheet_text, 0, 0, split_mode, file_type, page_name=sheet_name)
                            )
                            idx += 1
                    return chunks
                
                # Caso 3: PowerPoint (cada diapositiva es un chunk)
                elif file_type == "pptx":
                    ppt_file = io.BytesIO(raw_content)
                    presentation = pptx.Presentation(ppt_file)
                    for i, slide in enumerate(presentation.slides):
                        slide_text = []
                        for shape in slide.shapes:
                            if hasattr(shape, "text"):
                                slide_text.append(shape.text)
                        
                        full_slide_text = "\n".join(slide_text)
                        if full_slide_text.strip():
                            chunks.append(
                                create_chunk_to_list(doc_id, idx, full_slide_text, 0, 0, split_mode, file_type, page_num=i)
                            )
                            idx += 1
                    return chunks
                
                else:
                    print(f"[WARNING] No se puede dividir por páginas para el tipo '{file_type}'. Se usará el modo delimitador.")
                    split_mode = "delimiter" # Fallback a delimitador

            except Exception as e:
                print(f"[ERROR] Error al dividir por páginas: {e}. Se usará el modo delimitador.")
                split_mode = "delimiter" # Fallback a delimitador

        if split_mode == "size" and chunk_size and chunk_size > 0:
            print(f"[INFO] Dividiendo texto en chunks de tamaño {chunk_size} con superposición de {overlap}.")
            text_len = len(text)
            while pos < text_len:
                end = min(pos + chunk_size, text_len)
                chunk_text = text[pos:end]
                chunks.append(
                    create_chunk_to_list(doc_id, idx, chunk_text, pos, end, split_mode)
                )
                pos += chunk_size - overlap
                idx += 1
            return chunks

        # Modo por defecto y fallback: "delimiter"
        print(f"[INFO] Dividiendo texto por delimitador '{split_by}'.")
        parts = text.split(split_by)
        for part in parts:
            if part.strip():
                start = text.find(part, pos)
                end = start + len(part)
                chunks.append(
                    create_chunk_to_list(doc_id, idx, part, start, end, split_mode)
                )
                pos = end
                idx += 1
        return chunks

def create_chunk_to_list(
        doc_id: str, idx: int, text: str, 
        start: int, end: int, mode: str, 
        file_type: str = "", 
        page_num: int = 0, page_name: str = ""
) -> DocumentChunk:
    """
    Helper function to append a new chunk to the list of chunks.
    """
    if mode == "pages":
        if file_type == "pdf":
            text = f"Página {page_num + 1}:\n{text}"
        elif file_type in ["xlsx", "xls"]:
            text = f"Hoja: {page_name}\n{text}"
        elif file_type == "pptx":
            text = f"Diapositiva {page_num + 1}:\n{text}"
    return DocumentChunk(document_id=doc_id, chunk_id=idx, text=text, start=start, end=end)