#!/usr/bin/env python3
"""
Simple comment/string-aware brace counter. Strips out comments and
string/template/regex literals, then verifies that {, [, ( all balance.
This is a sanity check, not a full JS parser.
"""
import re, sys, os

def strip_literals(src):
    out = []
    n = len(src)
    i = 0
    state = "code"
    string_q = None
    last_significant = ""  # for regex disambiguation
    while i < n:
        c = src[i]
        nxt = src[i+1] if i + 1 < n else ""
        if state == "line":
            if c == "\n":
                state = "code"
                out.append(c)
            i += 1
            continue
        if state == "block":
            if c == "*" and nxt == "/":
                state = "code"
                i += 2
                continue
            if c == "\n":
                out.append(c)
            i += 1
            continue
        if state == "string":
            if c == "\\":
                i += 2
                continue
            if c == string_q:
                state = "code"
                last_significant = '"'
            elif c == "\n":
                # likely unterminated, treat as exit
                state = "code"
                out.append(c)
            i += 1
            continue
        if state == "template":
            if c == "\\":
                i += 2
                continue
            if c == "`":
                state = "code"
                last_significant = "`"
                i += 1
                continue
            if c == "$" and nxt == "{":
                # emit a placeholder paren so brace stays balanced when we
                # re-enter template after the matching }
                out.append("{")
                state = "tpl-expr"
                i += 2
                # remember depth via marker
                tpl_stack.append(0)
                continue
            if c == "\n":
                out.append(c)
            i += 1
            continue
        if state == "tpl-expr":
            # treat as normal code but keep braces balanced
            if c == "{":
                tpl_stack[-1] += 1
                out.append(c)
            elif c == "}":
                if tpl_stack[-1] == 0:
                    # closes the ${...}
                    tpl_stack.pop()
                    out.append("}")
                    state = "template"
                else:
                    tpl_stack[-1] -= 1
                    out.append("}")
            elif c in "([":
                out.append(c)
            elif c in ")]":
                out.append(c)
            else:
                # skip strings inside tpl-expr (recursive case is rare)
                out.append(c)
            i += 1
            continue
        if state == "regex":
            if c == "\\":
                i += 2
                continue
            if c == "[":
                state = "regex-class"
                i += 1
                continue
            if c == "/":
                state = "code"
                last_significant = "/"
                # skip flags
                j = i + 1
                while j < n and src[j].isalpha():
                    j += 1
                i = j
                continue
            if c == "\n":
                state = "code"
                out.append(c)
                i += 1
                continue
            i += 1
            continue
        if state == "regex-class":
            if c == "\\":
                i += 2
                continue
            if c == "]":
                state = "regex"
            i += 1
            continue
        # code
        if c == "/" and nxt == "/":
            state = "line"
            i += 2
            continue
        if c == "/" and nxt == "*":
            state = "block"
            i += 2
            continue
        if c == "'" or c == '"':
            state = "string"
            string_q = c
            i += 1
            continue
        if c == "`":
            state = "template"
            i += 1
            continue
        # Disambiguate /
        if c == "/" and nxt and nxt not in "=":
            # JSX closing tag </Foo> — '/' after '<' is never regex.
            if last_significant == "<":
                last_significant = "/"
                out.append(c)
                i += 1
                continue
            is_division = last_significant.isalnum() or last_significant in ")]}\"'`"
            if not is_division:
                state = "regex"
                i += 1
                continue
        if not c.isspace():
            last_significant = c
        out.append(c)
        i += 1
    return "".join(out)

tpl_stack = []

def line_col(src, idx):
    line = src.count("\n", 0, idx) + 1
    last_nl = src.rfind("\n", 0, idx)
    col = idx - last_nl
    return f"{line}:{col}"

def check(path):
    src = open(path, encoding="utf-8").read()
    global tpl_stack
    tpl_stack = []
    code = strip_literals(src)
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for i, c in enumerate(code):
        if c in "([{":
            stack.append((c, i))
        elif c in ")]}":
            if not stack:
                print(f"{path}:{line_col(src, i)} stray {c}")
                return False
            top = stack.pop()
            if top[0] != pairs[c]:
                print(f"{path}:{line_col(src, i)} expected match for {top[0]} opened at {line_col(src, top[1])}, got {c}")
                return False
    if stack:
        c, idx = stack[-1]
        print(f"{path}:{line_col(src, idx)} unclosed {c}")
        return False
    return True

def main():
    ok = True
    for p in sys.argv[1:]:
        if not os.path.exists(p):
            print(f"{p}: missing"); ok = False; continue
        try:
            r = check(p)
        except Exception as e:
            print(f"{p}: error {e}"); r = False
        if r:
            print(f"OK {p}")
        else:
            ok = False
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
