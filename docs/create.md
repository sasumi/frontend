# 创建自定义组件

[TOC]

原则上YWJ组件不依赖jQuery，用户可根据自己环境选择适合操作库（或使用原生DOM操作）。针对已有大部分已创建组件基于jQuery1.8搭建，因此推荐自定义也使用jQuery组件。

## 定义组件命名空间

``` html
<html>
    <head>
        <title>...</title>
        <!-- 引入SeaJS库 -->
        <script src="src/seajs/seajs.js"></script>
        <!-- 引入SeaJS配置文件 -->
        <script src="src/seajs/config.js"></script>
        <script>
             //方式一：定义组件MyComs命名空间存储目录
			seajs.config({paths: {"MyComs": '/static/js'}, charset: 'utf-8'});
			
            //方式二：直接定义组件调用地址
            seajs.config({
                alias: {
                    'MyComs/ComA': '/static/js/coma.js'
                }
            });
        </script>
    </head>
</html>
```

## 创建组件代码

组件基于AMD规范创建（SeaJS）。
/static/js/coma.js

``` javascript
define('MyComs/Coma', function(require){
    var $ = require('jquery'); //依赖jQuery组件
    var fun = function(msg){
        alert(msg);
    };
    
    //支持node click事件方式调用定义
    fun.nodeClick = function($node, param){
        var msg = param.message; //获取从节点传入的参数 <node data-mycoms_coma-message="hello">
        fun(msg);
    }
    
    //支持代码调用方式返回定义
    return fun;
})
```



