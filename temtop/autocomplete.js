/**
 * zwx modify by Jquery plugin
 */
define('temtop/autocomplete', function(require){
    var $ = require('jquery');
    require('temtop/resource/autocomplete.css');
    $(function(){
        $.fn.extend({
            _autocomplete_:function(){
                var elem =$(this);
                elem.attr("autocomplete","off")
                return new $.actions(elem);
            },
            selected: function(handler) {
                return this.bind("selected", handler);
            }
        });

        var listItems,
            active = -1,
            data,
            term = "",
            element,
            input,
            list;

        var timeout;
        var config={
            mouseDownOnSelect:true,
            clear:true
        };//用于全局的标志
        var options={}; //存放属性值
        var val_cach="";//临时存放数据
        $.actions = function(elem){
            elem.bind("keyup click ",function(e){//绑定键盘按钮 和 click事件
                //设置某些特殊键不触发
                var KEY = {
                    "38":1,//up
                    "40":1,//DOWN: 40,
                    "46":1,//DEL: 46,
                    "39":1, //TAB: 9,
                    "13":1, // RETURN: 13,
                    "27":1, //ESC: 27,
                    "188":1, //COMMA: 188,
                    "33":1,//PAGEUP: 33,
                    "34":1//PAGEDOWN: 34,
                    // "8":1 //BACKSPACE: 8
                };
                input=$(this); //存在改input 元素
                options['top']=$(this).offset().top+$(this).context.offsetHeight; //通过input计算显示时的位置 上边距
                options['left']=$(this).offset().left-1; //通过input计算显示时的位置 左边距
                options['height']=$(this).context.offsetHeight;//input的高度
                options['scroll']=($(this).attr("data-scroll")=='false')?false:true;//设置是否要滚动条 默认为有
                options['is-fill']=($(this).attr("is-fill")=='false')?false:true;//是否允许手填 默认为允许
                options['hide-key']=($(this).attr("hide-key")=='false')?false:true;//隐藏key 默认为true
                if(!KEY[e.keyCode]) { // 特殊的键不做处理
                    var min = $(this).attr("data-min") ? ($(this).attr("data-min")>0?$(this).attr("data-min"):0) : 3; // 最小字符  默认为 3 最小为0
                    var source = $(this).attr("data-source"); // 后台处理程序地址
                    options['source'] = typeof source == "string" ? source : null;
                    var width = $(this).attr("data-width") ? $(this).attr("data-width") : $(this).context.offsetWidth; //宽度
                    options['width']=width;
                    var delay = $(this).attr("data-delay") ? $(this).attr("data-delay") : 1000;//延时触发时间
                    var val = $(this).val(); //输入的值
                    options['data']=val;
                    clearTimeout(timeout);
                    if (val.length >= min) { //超过三个字符开始触发
                        timeout = setTimeout(send, delay); // 延时响应
                    }else{
                        if(element){
                            element.hide(); //隐藏
                        }
                    }
                }else{
                    if(e.keyCode == 38){ //向上键
                        moveSelect(-1);
                    }else if(e.keyCode ==40){ //向下按键
                        moveSelect(1);
                    }else if(e.keyCode ==13){//按enter键时的操作
                        if(list){
                            var lis =list.find("li")?list.find("li"):'';//获取到所有的li元素
                            if(lis.length>0){
                                var datas = options.datas;
                                var index=0;
                                $.each(datas,function(k,v){
                                    if(index==active){
                                        input.val(v);
                                        val_cach=v;

                                        $(input).trigger("selected",[k,v]);
                                        element.hide();
                                    }
                                        index+=1;

                                });
                             /*   input.val(listItems[active].children[0].innerHTML);//把当前位置的值复制到input上去
                                val_cach=listItems[active].children[0].innerHTML;
                                var key =listItems[active].children[1].innerHTML;
                                var __item=options['datas'];
                                $(input).trigger("selected",[key,__item[key]]);*/

                            }
                        }
                    }

                }
            });
            elem.on("blur",function(e){//失去焦点操作
                if(element){
                    element.hide();
                }
                if(!config.mouseDownOnSelect){ //当选中了某一项值时 由于需要给input重新获得焦点
                    $(this).focus();
                    config.mouseDownOnSelect=true; //用于判断是否要隐藏
                }
                if(!options['is-fill']){//是否手填
                    $(input).val(val_cach);
                }

            });
            elem.bind("keypress",function(e){ //禁用当使用enter键时的提交操作
                if(e.keyCode==13){
                    return false;
                }

            })

        }

        //获得数据后的渲染 创建
        function init(data) {
            active=-1;//重置
            options['datas']=data;//重置数据
            if (!element) { //判断是否已经创建了
                //  var hid_input = $("<input hidden='true'/>").appendTo(input.parent());

                element = $("<div />")
                    .addClass("ac_results")
                    .css("position", "absolute")
                    .appendTo(document.body); //创建一个div 并加上样式
                element.css({
                    width:options.width,
                    top: options.top,
                    left: options.left
                }); //把该div的位置移动到跟input紧靠的位置
                // list.css({height:10*options.height})
                // list = $("<ul/>").appendTo(element);//创建一个ul 元素
            }else{
                element.css({
                    width:options.width,
                    top: options.top,
                    left: options.left
                });//重定义位置  这样是解决当有多个input 需要用到时
                // list.css({height:10*options.height});
                element.show();
            }
            element.children("ul").remove(); //先移除之前的数据
            if(data.length==0){
                list = $("<ul/>").appendTo(element)
                var li = $("<li/>").addClass("ac_no_li").appendTo(list)[0];
                var span =$("<span/>").text("没有数据").addClass("ac_no_span").appendTo(li);
            }else {
                list = $("<ul/>").appendTo(element) .mouseover(function (event) {
                    if(target(event).nodeName && target(event).nodeName.toUpperCase() == 'LI') {
                        active = $("li", list).removeClass('ac_over').index(target(event));
                        $(target(event)).addClass('ac_over');
                    }
                });
                /* .mouseout(function (event) {
                    if (target(event).nodeName && target(event).nodeName.toUpperCase() == 'LI') {
                        active = $("li", list).removeClass('ac_over').index(target(event));
                        //  $(target(event)).addClass('ac_over');
                    }
                });*/ //创建一个ul 元素 给它绑定 moseover事件
                var flag=0;
              $.each(data, function (i, item) {
                  flag+=1;
                  var span="<span >"+(item?item:'')+"</span>";
                  if(options["hide-key"]==false){ span+="<br/><span>"+i+"</span>";}
                  var __data={};
                  __data[i]=item;
                    var li = $("<li/>").html(span).addClass(flag % 2 == 0 ? "ac_even" : "ac_odd").appendTo(list).mousedown(function (event) {
                        input.val(item);
                        val_cach=item;
                        $.data(li, "ac_data", item);
                        $(input).trigger("selected",[i,item]);
						element.hide();
                        config.mouseDownOnSelect = false;
                    })[0];

                })
               // for each(var item in )
            }
            if(options.scroll){
                scroll();//滚动条
            }

        }
        function target(event) {
            var element = event.target;
            while(element && element.tagName != "LI")
                element = element.parentNode;
            if(!element)
                return [];
            return element;
        }
        //延时响应
        function send() {
            $.ajax({
                type: "POST",
                dataType: "json",
                data:{data:options.data} ,
                url: options.source,
                success: function (data) {
                    init(data.data);
                }
            });

        };
        //产生滚动条方法
        function scroll(){
            list.scrollTop(0);
            list.css({
                maxHeight: 10.5*options.height,
                overflow: 'auto'
            });

        }
        //按键移动 向上向下移 1 向下 -1 向上
        function moveSelect(step) {
            if(element.is(":hidden")==false) { // 当元素被隐藏时不做处理
                listItems = list.find("li");//取到所有的li元素
                listItems.slice(active, active + 1).removeClass('ac_over');//先移除该元素的样式
                movePosition(step);//移动函数
                var activeItem = listItems.slice(active, active + 1).addClass('ac_over');//给移动后li添加样式
                if (options.scroll) {//判断是否有滚动条
                    var offset = 0;//临时变量 用于判断是否给滚动条移动
                    listItems.slice(0, active).each(function () {
                        offset += this.offsetHeight; //每移动一步 就把高度加进去
                    });
                    if ((offset + activeItem[0].offsetHeight - list.scrollTop()) > list[0].clientHeight) { //通过高度判断是否达到了移动滚动条的高度
                        list.scrollTop(offset + activeItem[0].offsetHeight - list.innerHeight()); //给滚动条加上 离顶部的距离  （移动滚动条）
                    } else if (offset < list.scrollTop()) {
                        list.scrollTop(offset);
                    }
                }
                //input.val(listItems[active].children[0].innerHTML);//把当前位置的值复制到input上去
            }
        };
        //移动位置
        function movePosition(step) {
            active += step;
            if (active < 0) {
                active = listItems.size() - 1;
            } else if (active >= listItems.size()) {
                active = 0;
            }
        }
    });
});