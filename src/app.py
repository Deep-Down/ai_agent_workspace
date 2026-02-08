from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
import json
from datetime import datetime

from starlette.responses import FileResponse

import logic
from db import DatabaseManager
import uvicorn
import traceback

print("FastAPI приложение запускается...")

try:
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    try:
        database = DatabaseManager()
        database.ensure_database_exists()
    except Exception as e:

        traceback.print_exc()
        database = None

    file_store = {}


    @app.post("/chat-with-files")
    async def upload_file(
            projectId: str = Form(...),
            message: str = Form(...),
            filesMeta: str = Form(...),
            files: List[UploadFile] = File(...)):

        whole_content = []

        try:

            for i, file in enumerate(files):
                print(f"Файл {i + 1}: {file.filename}")
                try:
                    meta_list = json.loads(filesMeta)
                    if i < len(meta_list):
                        meta = meta_list[i]
                        if meta.get("type") == "audio":
                            print(f"Обработка аудио файла...")
                            content = await logic.extract_text_from_audio(file, meta)
                            print(f"Аудио обработано: {len(content)} символов")
                            whole_content.append(content)
                        else:
                            print(f"Заглушка для типа: {meta.get('type')}")
                    else:
                        raise HTTPException(status_code=400, detail="Missing metadata for file")
                except json.JSONDecodeError as e:
                    print(f"Ошибка парсинга JSON метаданных: {e}")
                    raise HTTPException(status_code=400, detail="Invalid JSON in metadata")

            content = '\n'.join(whole_content)
            print(f"Общий контент: {len(content)} символов")

            try:
                if database:
                    con = {
                        "id": projectId,
                        "message": message,
                        "file": content
                    }
                    database.save_products([con])
                else:
                    print("БД не доступна, пропускаем сохранение")
            except Exception as e:
                print(f"Ошибка сохранения в БД: {e}")

            print("Генерация ответа AI...")
            response = await logic.generate_message(content, message)
            print(f"Ответ AI сгенерирован ({len(response) if response else 0} символов)")


            if response:
                return {
                    "success": True,
                    "message": response
                }
            else:
                print("AI вернул пустой ответ")
                return None

        except Exception as e:
            print(f"Ошибка в /chat-with-files: {e}")
            print("Трассировка ошибки:")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=str(e))


    @app.post("/chat")
    async def chat(request: Request):
        print("Получен запрос /chat")

        try:
            data = await request.json()
            message = data.get("message", "")
            projectId = data.get("projectId", "")

            # Получаем все файлы с ключем projectId (заглушка)
            files = ''

            response = await logic.generate_message(files, message)

            if response:
                return {
                    "success": True,
                    "message": response
                }
            else:
                print("AI вернул пустой ответ")
                return None
        except Exception as e:
            print(f"Ошибка в /chat: {e}")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/")
    async def root():
        return FileResponse("../index.html")

    @app.get("/health")
    async def health_check():
        return {
            "status": "ok" if database else "warning",
            "database": "connected" if database else "disconnected",
            "timestamp": str(datetime.now())
        }
    print("FastAPI приложение инициализировано успешно!")

except Exception as e:
    print(f"КРИТИЧЕСКАЯ ОШИБКА при инициализации приложения: {e}")
    traceback.print_exc()
    raise

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
