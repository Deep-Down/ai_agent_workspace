import sys
from typing import Optional, Dict, List
import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor


class DatabaseManager:
    def __init__(self) -> None:
        self.connection = None
        self.cursor = None
        self.config = {
            'host': 'localhost',
            'port': 5432,
            'user': 'postgres',
            'password': '12345678',
            'database': 'files'
        }

    def connect(self):
        try:
            self.connection = psycopg2.connect(**self.config)
            self.cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            print(f"Успешное подключение к БД {self.config['database']}")
            return True
        except psycopg2.OperationalError as e:
            print(f"База данных {self.config['database']} не существует или недоступна: {e}")
            return False
        except Exception as e:
            print(f"Ошибка подключения к БД: {e}")
            return False

    def ensure_database_exists(self) -> bool:
        try:
            if self.connect():
                print(f"База данных {self.config['database']} уже существует")
                return True

            print(f"Создание базы данных {self.config['database']}...")

            sys_conn = psycopg2.connect(
                host=self.config['host'],
                port=self.config['port'],
                user=self.config['user'],
                password=self.config['password'],
                database='postgres'
            )
            sys_conn.autocommit = True
            sys_cursor = sys_conn.cursor()

            sys_cursor.execute(
                sql.SQL("CREATE DATABASE {}").format(
                    sql.Identifier(self.config['database'])
                )
            )
            print(f"База данных {self.config['database']} создана")

            sys_cursor.close()
            sys_conn.close()

            if not self.connect():
                print("Не удалось подключиться к созданной базе данных")
                return False

            # СОЗДАЕМ ТАБЛИЦУ products (а не files)
            create_table = """
            CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(500) PRIMARY KEY,
                message TEXT,
                files TEXT
            );
            """
            self.cursor.execute(create_table)
            self.connection.commit()
            print("Таблица 'products' создана или уже существует")

            return True

        except Exception as e:
            print(f"Ошибка при создании БД: {e}")
            return False

    def save_products(self, products: List[Dict]) -> int:  # Изменил имя параметра на products
        if not self.cursor:
            if not self.connect():
                return 0

        if not products:
            return 0

        saved = 0
        try:
            for product in products:
                if not product.get('id'):
                    print(f"Пропускаем product без id: {product}")
                    continue

                sql_query = """
                INSERT INTO products (id, message, files) 
                VALUES (%s, %s, %s)
                ON CONFLICT (id) 
                DO UPDATE SET 
                    message = EXCLUDED.message,
                    files = EXCLUDED.files
                """

                try:
                    self.cursor.execute(sql_query, (
                        product.get('id', '').strip(),
                        product.get('message', '').strip(),
                        product.get('files', '').strip()
                    ))
                    saved += 1
                    print(f"Сохранен product с id: {product.get('id')}")
                except Exception as e:
                    print(f"Ошибка сохранения product {product.get('id')}: {e}")
                    continue

            self.connection.commit()
            print(f"Всего сохранено: {saved} записей")
            return saved


        except Exception as e:
            print(f"Ошибка сохранения products: {e}")
            if self.connection:
                self.connection.rollback()
            return 0

    def search_products_db(self, product_id: str) -> Optional[Dict]:
        if not self.cursor:
            if not self.connect():
                return None

        try:
            sql_query = """
                SELECT id, message, files 
                FROM products 
                WHERE id = %s
            """
            self.cursor.execute(sql_query, (product_id,))
            result = self.cursor.fetchone()

            if result:
                print(f"Найден product с id: {product_id}")
                return dict(result)
            else:
                print(f"Product с id {product_id} не найден")
                return None

        except Exception as e:
            print(f"Ошибка при получении данных product по ID {product_id}: {e}")
            return None

    def close(self):
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
            print("Соединение с БД закрыто")


# Тестовый код для проверки
if __name__ == "__main__":
    print("=== Тестирование DatabaseManager ===")

    db = DatabaseManager()

    # Создаем БД и таблицу
    if db.ensure_database_exists():
        print("БД и таблица созданы")

        # Тест сохранения
        test_products = [
            {
                "id": "test_project_1",
                "message": "Тестовое сообщение",
                "files": "Тестовый контент файла"
            }
        ]

        saved_count = db.save_products(test_products)
        print(f"Сохранено записей: {saved_count}")

        # Тест поиска
        found = db.search_products_db("test_project_1")
        if found:
            print(f"Найденная запись: {found}")
        else:
            print("Запись не найдена")

        db.close()
    else:
        print("❌ Ошибка создания БД")
