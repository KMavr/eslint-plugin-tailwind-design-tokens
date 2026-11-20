# Renders assets/demo.gif. Run from the repo root: vhs assets/demo.tape
Output assets/demo.gif

Set Shell bash
Set FontSize 14
Set Width 1440
Set Height 390
Set Padding 20
Set Theme "Catppuccin Mocha"
Set TypingSpeed 40ms

Hide
Type "npm run build --silent && cd examples && npm install --silent --no-audit --no-fund && clear"
Enter
Sleep 15s
# Relative paths in ESLint output so the GIF doesn't leak the recorder's home directory.
Type `export FORCE_COLOR=1 GIT_PAGER=cat PS1='\[\e[38;5;117m\]examples\[\e[0m\] $ '; npx() { command npx "$@" | sed "s|$PWD/||"; }; clear`
Enter
Sleep 1s
Show

Type "# Lint a component with hardcoded colors and a stock Tailwind class"
Sleep 1s
Enter
Type "npx eslint src"
Sleep 500ms
Enter
Sleep 6s

Ctrl+L
Type "# Arbitrary values auto-fix to the matching token"
Sleep 1s
Enter
Type "npx eslint src --fix; git diff -U1 src/Button.jsx"
Sleep 500ms
Enter
Sleep 10s

Hide
Type "git checkout -q src/Button.jsx"
Enter
Sleep 500ms
