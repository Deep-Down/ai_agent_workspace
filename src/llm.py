from ollama import Client
import math
from prompts import *


# Обёртки сообщений
def wrap_to_msg(role, content): return {'role': role, 'content':content}
def wrap_to_sys_msg(content): return wrap_to_msg('system',content)
def wrap_to_user_msg(content): return wrap_to_msg('user',content)
def wrap_to_assist_msg(content): return wrap_to_msg('assistant',content)

async def SQA(messages, model_name = "gemma3:12b",
        host = 'https://bluegill-probable-walrus.ngrok-free.app'):
    OllamaClient = Client(host=host)
    return OllamaClient.chat(model=model_name, messages=messages)['message']['content']


# Составление протокола по транскрибации
class ProtocolParser:
    def __init__(self):
        self.messages = [wrap_to_sys_msg(sys_prompt_task),
                         wrap_to_sys_msg(sys_prompt_protocol_structure),
                         "", ""]
    
    async def Parse(self, transcript, step = 10):
        rows = await self.TranskriptToRows(transcript)
        protocol_md = empty_protocol
        
        iters = math.ceil(len(rows)/step)
        for i in range(iters):
            chank = "\n".join(rows[i*step:i*step+step])
            protocol_md = await self.Iter(protocol_md, chank)
        return protocol_md

    async def TranskriptToRows(self, transcript):
        res = []
        for x in transcript.split("\n"):
            x = x.strip()
            if (x != ""):
                res.append(x)
        return res

        
    async def Iter(self, protocol_md, chank):
        self.messages[2] = wrap_to_assist_msg(protocol_md)
        self.messages[3] = wrap_to_user_msg(chank)
        res = await SQA(messages=self.messages)
        return res




