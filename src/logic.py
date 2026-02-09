import os
import tempfile
from main_ai import ask_llm
from fastapi import HTTPException
from starlette.datastructures import UploadFile
import asyncio

def text_to_markdown_basic(text):
    lines = text.split('\n')
    md_lines = []

    for line in lines:
        line = line.strip()

        if not line:
            md_lines.append('')
            continue

        if len(line) < 80 and not line.endswith('.') and not line.endswith(':'):
            if line.isupper():
                md_lines.append(f'# {line}')
            elif line[0].isupper() and not line.isupper():
                md_lines.append(f'## {line}')
            else:
                md_lines.append(line)
        else:
            md_lines.append(line)

    return '\n'.join(md_lines)

async def generate_message(text, instructions):
    resp = await ask_llm(text)
    return resp


async def extract_text_from_txt(file: UploadFile) -> str:
    """
    Извлекает текст из текстового файла с обработкой разных кодировок
    """
    try:
        # Читаем содержимое файла
        content_bytes = await file.read()

        # Проверяем, что файл не пустой
        if not content_bytes:
            return ""

        # Пробуем разные кодировки
        encodings_to_try = ['utf-8', 'cp1251', 'windows-1251', 'koi8-r', 'iso-8859-5', 'utf-16']

        for encoding in encodings_to_try:
            try:
                text = content_bytes.decode(encoding)
                print(f"Файл {file.filename} успешно декодирован с кодировкой {encoding}")
                return text
            except UnicodeDecodeError:
                continue

        # Если ни одна кодировка не подошла, пробуем с игнорированием ошибок
        try:
            text = content_bytes.decode('utf-8', errors='ignore')
            print(f"Файл {file.filename} декодирован с игнорированием ошибок")
            return text
        except:
            return "[Не удалось декодировать текст файла]"

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка чтения текстового файла: {str(e)}"
        )

async def extract_text_from_audio(file: UploadFile, metadata):
    print('Extracting text from audio file')
    # with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp_file:
    #     content = await file.read()
    #     tmp_file.write(content)
    #     tmp_path = tmp_file.name
    # try:
    #     model =
    #
    #     result = model.transcribe(tmp_path)
    #     return result["text"]
    #
    # finally:
    #     os.unlink(tmp_path)

