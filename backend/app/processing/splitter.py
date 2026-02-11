import logging
from typing import List
from app.processing.extractor import _get_file_type
import io, fitz, pandas as pd, pptx
from app.models.document import DocumentChunk, DocumentCreate

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

        # --- MODO 1: JUNTO (WHOLE) ---
        if split_mode == "whole":
            logging.info(f"[INFO] Modo 'whole': Guardando documento entero como un solo chunk.")
            # Si es muy grande, Qdrant podría rechazarlo, pero cumplimos la orden del usuario.
            # Limpiamos un poco el texto de nulos
            clean_text = text.replace('\x00', '')
            if clean_text.strip():
                chunks.append(create_chunk_to_list(doc_id, 0, clean_text, 0, len(clean_text), "whole"))
            return chunks

        # --- MODO 2: PÁGINAS ---
        if split_mode == "pages":
            file_type = _get_file_type(filename, content_type)
            logging.info(f"[INFO] Dividiendo por páginas para el tipo de archivo: {file_type}")

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
                    logging.info(f"[WARNING] No se puede dividir por páginas para el tipo '{file_type}'. Se usará el modo delimitador.")
                    # Fallback continúa abajo
            except Exception as e:
                logging.info(f"[ERROR] Error al dividir por páginas: {e}. Se usará el modo delimitador.")
                # Fallback continúa abajo

        # --- MODO 3: TAMAÑO FIJO ---
        if split_mode == "size" and chunk_size and chunk_size > 0:
            logging.info(f"[INFO] Dividiendo texto en chunks de tamaño {chunk_size} con superposición de {overlap}.")
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

        # --- MODO 4 (DEFAULT): DELIMITADOR ---
        logging.info(f"[INFO] Dividiendo texto por delimitador '{split_by}' (reteniendo el delimitador).")
        
        # Lógica de split por delimitador (Misma que antes)
        indices = []
        start_index = 0
        while True:
            pos = text.find(split_by, start_index)
            if pos == -1:
                break
            indices.append(pos)
            start_index = pos + 1 
        
        parts = []
        last_pos = 0
        
        if indices:
            first_delimiter_pos = indices[0]
            parts.append(text[last_pos:first_delimiter_pos])
            last_pos = first_delimiter_pos
        
        for i in range(len(indices) - 1):
            start_of_chunk = indices[i]
            end_of_chunk = indices[i+1]
            parts.append(text[start_of_chunk:end_of_chunk])
            last_pos = end_of_chunk
            
        if indices:
            last_delimiter_pos = indices[-1]
            parts.append(text[last_delimiter_pos:])
        elif not parts and text:
            parts.append(text)

        current_pos_in_text = 0
        for part in parts:
            if part.strip():
                start = text.find(part, current_pos_in_text)
                if start != -1:
                    end = start + len(part)
                    chunks.append(
                        create_chunk_to_list(doc_id, idx, part, start, end, "delimiter")
                    )
                    current_pos_in_text = start + 1 
                    idx += 1
                else:
                    # Fallback simple si find falla por caracteres especiales
                    chunks.append(create_chunk_to_list(doc_id, idx, part, 0, 0, "delimiter"))
                    idx += 1

        return chunks

def create_chunk_to_list(
        doc_id: str, idx: int, text: str, 
        start: int, end: int, mode: str, 
        file_type: str = "", 
        page_num: int = 0, page_name: str = ""
) -> DocumentChunk:
    if mode == "pages":
        if file_type == "pdf":
            text = f"Página {page_num + 1}:\n{text}"
        elif file_type in ["xlsx", "xls"]:
            text = f"Hoja: {page_name}\n{text}"
        elif file_type == "pptx":
            text = f"Diapositiva {page_num + 1}:\n{text}"
    return DocumentChunk(document_id=doc_id, chunk_id=idx, text=text, start=start, end=end)