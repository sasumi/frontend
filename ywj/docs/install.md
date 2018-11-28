# 安装使用

[TOC]

## 环境要求

YWJ框架对浏览器版本依赖由各组件自身版本依赖决定。框架底层机制支持IE6+或其他高级浏览器。如需保证所有组件能正确使用。浏览器版本如下：

| 浏览器                                            | 版本                     |
| ------------------------------------------------- | ------------------------ |
| Internet Explorer                                 | 9+                       |
| Chrome 谷歌                                       | 16+                      |
| Firefox                                           | 24+                      |
| Chrome核心浏览器（如360极速版、搜狗浏览器极速版） | 支持                     |
| IE核心浏览器（如360安全浏览器、QQ浏览器）         | 系统中安装IE9+浏览器即可 |

## 代码调用

html 库代码嵌入方式：

``` html
<html>
    <head>
        <title>....</title>
        <!-- 引入SeaJS库 -->
        <script src="seajs/seajs.js"></script>
        <!-- 引入SeaJS配置文件 -->
        <script src="seajs/config.js"></script>
    </head>
    <body>
    </body>
</html>
```

功能调用：
HTML调用（部分组件支持）

- 组件统一调用方式为 data-component="ComA,ComB"，其中组件名称顺序会影响实际绑定、执行的结果。特别是多个组件同时绑定用户行为事件（如click、keydown），前一个组件逻辑可能会阻止事件继续触发。
- 参数解析规则：
  1. data-coma="hello" 将被解析为 `param="hello"`；
  2. data-coma-key="hello" 将被解析为 `param = {key: 'hello'}`；
  3. 组件名称统一转换为小写，如组件名称中出现斜杠，将被替换为下划线 "_"，例如：LibA/ComB对应参数方式为 data-liba_comb-param="hello"。

``` html
<!-- DIV 调用方式 -->
<div data-component="ComponentA" data-componenta-param1="value1" data-component-param1="value2">
</div>

<!-- INPUT 调用方式 -->
<input type="text" name="psw" data-component="Password"/>

<!-- 多组件调用方式 -->
<a href="/submit.cgi" data-component="Confirm,Async" data-confirm-message="是否确认提交">
    提交数据
</a>
```

Javascript脚本调用方式（所有组件支持）

``` javascript
seajs.use('ywj/confirm', funciton(confirm){
    var $a = $('a');
	confirm.nodeClick($a);
});
```

