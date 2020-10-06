def _short_text_(text, length):
    """Shorten text e.g. for title purpose"""
    if len(text) < length:
        return text
    else:
        left, sub, right = text.rpartition(' ')
        if left:
            return left
        else:
            return right[:length]