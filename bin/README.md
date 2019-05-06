# 发布压缩版本
版本压缩采用 Google closure compiler压缩器，环境需要安装 JRE 1.8或以上版本。
- min版本：由于ywj内部涉及lang函数语法，暂不支持语法层面文件压缩。默认使用文件合并、去空白方式压缩。
- debug版本：仅采用文件合并方式压缩。

[Google Closure Compiler](https://developers.google.com/closure/compiler/)，[JAVA JRE](https://java.com/en/download/)