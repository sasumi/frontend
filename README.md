# 开始使用

[TOC]

## 简介

YWJ前端研发框架是一款基于HTML语义化扩展支持的轻量化组件框架。框架中的组件基于 [SeaJS][1] 模块方式进行建设，采用同步支持HTML自动化调用以及支持SeaJS模块两种调用方式。实现研发人员无需编写过多Javascript代码实现前端组件无缝调用。

HelloWorld示例：

``` html
<html>
    <head>
        <title>Hello World</title>
        <!-- 引入SeaJS库、配置文件 -->
        <script src="seajs/seajs.js"></script>
        <script src="seajs/config.js"></script>
    </head>
    <body>
        <!-- 使用HTML方式调用 -->
        <div data-component="HelloWorld" data-helloworld-message="你好，世界！"></div>
        
        <!-- 使用Javascript方式调用 -->
        <div id="#msg"></div>
        <script>
            seajs.use('ywj/HelloWorld', function(HelloWorld){
               	var h = new HelloWorld('#msg');
                h.message = '你好，世界！';
                h.show();
            });
        </script>
    </body>
</html>
```

框架中大部分组件基于HTML语义化，诸如Async异步提交组件，基于HTML原生Form表单应用。调用方式如下：

``` html
<form action="/formsubmit.cgi" method="post" data-component="Async">
    Name: <input type="text" name="name" value="John"/><br/>
    Password: <input type="password" name="password" value=""/><br/>
    <input type="submit" value="Login"/>
</form>
```

这种研发理念，后台研发需要尽量保持“双模式”支持，增强Web功能语义化、强壮性。

## 相关文档

- [安装说明](docs/install.md)
- [组件列表](docs/components.md)
- [自定义组件](docs/create.md)

![1] SeaJS (http://www.seajs.com)