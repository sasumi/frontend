@echo off
echo Building dist/ywj.min.js
java -jar closure-compiler.jar --js ../src/component/*.js --js_output_file ../dist/ywj.min.js --create_source_map ../dist/ywj.sourcemap.js --compilation_level WHITESPACE_ONLY

echo Building dist/ywj.debug.js
java -jar closure-compiler.jar --js ../src/component/*.js --js_output_file ../dist/ywj.debug.js --compilation_level BUNDLE
echo Done
pause