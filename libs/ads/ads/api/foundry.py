import random
import string


def generate_id():
    # 16 char random hex
    return "".join(random.choices(string.ascii_letters + string.digits, k=16))
