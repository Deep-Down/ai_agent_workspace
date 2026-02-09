from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import pypandoc

txt = \
"""## 2 Повестка ++ мы устали слушать лекции по мл и хотим уже что-то делать
Обсуждение архитектурного решения для модуля тендерных закупок и плана интеграции с 1С. Также обсуждается необходимость проверки новых поставщиков.

1.  Сценарии работы модуля:
    *   Создание тендера
    *   Рассылка поставщикам
    *   Сбор и сравнение коммерческих предложений
    *   Верификация новых поставщиков (добавлено по предложению С.А.)

## 4 Термины и определения
*   MVP – Минимально жизнеспособный продукт (упрощенная версия продукта для первоначального тестирования).

## 5 Сокращения и обозначения
*   ИНН – Идентификационный номер налогоплательщика
*   ФНС – Федеральная налоговая служба
*   API – Application Programming Interface (интерфейс прикладного программирования)

## 6 Содержание встречи
На встрече была представлена архитектура модуля тендерных закупок. Обсуждались ключевые сценарии работы модуля и план интеграции с 1С. Сергей А. подчеркнул важность автоматической верификации новых поставщиков, добавив это в список приоритетов. Павел В. предложил использовать API ФНС и коммерческие сервисы, такие как «Сбис», для проверки поставщиков, отметив, что это повлияет на бюджет. Сергей А. выразил обеспокоенность сроками, отметив, что сезон закупок начинается через 2 месяца. Для ускорения процесса Павел В. предложил разработку MVP, включающую создание тендера и ручной ввод проверенных поставщиков.

## 7 Вопросы
1.  Какие сроки реализации прототипа модуля тендерных закупок?
2.  Какова стоимость использования коммерческих сервисов для проверки поставщиков (например, «Сбис»)?
3.  Возможно ли ускорение сроков реализации прототипа модуля?

### Ответы
1.  По текущему плану, прототип модуля тендерных закупок готов через 5 недель. Добавление модуля верификации сместит дату на 2-3 недели.
2.  Стоимость использования коммерческих сервисов для проверки поставщиков будет учтена в отдельном бюджете.
3.  Возможно ускорение разработки через MVP (минимально жизнеспособный продукт), который будет готов через 3 недели.

## 8 Решения
1.  Включить модуль проверки поставщиков в план разработки.
2.  Разработать MVP модуля тендерных закупок с базовыми функциями через 3 недели.
3.  Оценить стоимость использования коммерческих сервисов для проверки поставщиков и включить это в бюджет.

### 8.1 Открытые вопросы
1.  Каковы конкретные критерии для оценки репутации поставщиков?

## Лакуны
*   [00:01:40] – Не указана конкретная стоимость использования коммерческих сервисов для проверки поставщиков.

| Имя       | Возраст | Город       |
|-----------|--------|------------|
| Алексей   | 25     | Москва     |
| Мария     | 30     | Санкт-Петербург |
| Иван      | 22     | Казань     |

"""


def convert_md_to_doc(md_text):
    if "## 4" in md_text:
        splited = md_text.split("## 4")
        text = ("""# ПРОТОКОЛ ОБСЛЕДОВАНИЯ\n\n## 1. Дата встречи\n""" + splited[0]
                + """## 3. Участники: \n## 4."""
                + splited[1])
    else:
        text = md_text
    pypandoc.convert_text(text, 'docx', format='md', outputfile='output.docx')
    document = Document('output.docx')
    redefine_styles(document)
    document.save('output.docx')
    return 'output.docx'


def redefine_styles(document):
    section = document.sections[0]

    section.top_margin = Inches(0.58)
    section.bottom_margin = Inches(0.59)
    section.left_margin = Inches(0.98)
    section.right_margin = Inches(0.59)

    styles = document.styles

    section.start_type = 1
    section.page_start = 1

    styles['Normal'].font.name = 'Times New Roman'
    styles['Normal'].font.size = Pt(12)
    styles['Normal'].paragraph_format.line_spacing = Pt(12)

    heading1_style = styles['Heading 1']
    heading1_style.font.name = 'Times New Roman'
    heading1_style.font.size = Pt(12)
    heading1_style.font.all_caps = True
    heading1_style.font.bold = True
    heading1_style.font.color.rgb = RGBColor(0, 0, 0)
    heading1_style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER

    heading2_style = styles['Heading 2']
    heading2_style.font.name = 'Times New Roman'
    heading2_style.font.size = Pt(12)
    heading2_style.font.underline = True
    heading2_style.font.bold = False
    heading2_style.font.color.rgb = RGBColor(0, 0, 0)

    heading3_style = styles['Heading 3']
    heading3_style.font.name = 'Times New Roman'
    heading3_style.font.size = Pt(12)
    heading3_style.font.underline = True
    heading3_style.font.bold = False
    heading3_style.font.color.rgb = RGBColor(0, 0, 0)

    for p in document.paragraphs:
        if p.style.name.startswith('Heading'):
            run = p.runs[0]
            run.font.name = 'Times New Roman'


if __name__ == "__main__":
    convert_md_to_doc(txt)
