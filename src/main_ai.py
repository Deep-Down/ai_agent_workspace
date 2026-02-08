# Потребуется установить ollama на сервер 
# curl -fsSL https://ollama.com/install.sh | sh
import traceback

from llm import *


import example

async def ask_llm(transcript: str):

    try:
        print(f"Запуск нейронки, текст: {len(transcript)} символов")

        pp = ProtocolParser()
        res = await pp.Parse(transcript, 15)

        print(f"Нейронка вернула ответ: {len(res)} символов")
        print(f"Первые 200 символов: {res[:200]}...")

        return res
    except Exception as e:
        print(f"Ошибка в ask_llm: {e}")
        traceback.print_exc()
        return f"Ошибка генерации: {str(e)}"
#print(SQA([wrap_to_user_msg(example.transcript)]))
