(function(){
    //if developer has not defined a image url for lazy loading then use the default
    var qazy_image = qazy_image || "http://cdn.guojj.com/lazyload/default.gif";
    var view_elements = [];

    /**
     * 获取窗口的相关测量信息
     * @returns {{}}
     */
    var getRegion = function(win){
        var info = {};
        win = win || window;
        var doc = win.document;
        info.screenLeft = win.screenLeft ? win.screenLeft : win.screenX;
        info.screenTop = win.screenTop ? win.screenTop : win.screenY;

        //no ie
        if(win.innerWidth){
            info.visibleWidth = win.innerWidth;
            info.visibleHeight = win.innerHeight;
            info.horizenScroll = win.pageXOffset;
            info.verticalScroll = win.pageYOffset;
        } else {
            //IE + DOCTYPE defined || IE4, IE5, IE6+no DOCTYPE
            var tmp = (doc.documentElement && doc.documentElement.clientWidth) ?
                doc.documentElement : doc.body;
            info.visibleWidth = tmp.clientWidth;
            info.visibleHeight = tmp.clientHeight;
            info.horizenScroll = tmp.scrollLeft;
            info.verticalScroll = tmp.scrollTop;
        }

        var tag = (doc.documentElement && doc.documentElement.scrollWidth) ?
            doc.documentElement : doc.body;
        info.documentWidth = Math.max(tag.scrollWidth, info.visibleWidth);
        info.documentHeight = Math.max(tag.scrollHeight, info.visibleHeight);
        return info;
    };

    //detects if the img has entered viewport or not.
    var reveal = function(){
        var body = document.body || {};

        for(var count = 0; count < view_elements.length; count++)
        {
            var offsetParentTop = 0;
            var temp = view_elements[count];
            do
            {
                if(!isNaN(temp.offsetTop))
                {
                    offsetParentTop += temp.offsetTop;
                }
            }while(temp = temp.offsetParent)

            var pageYOffset =  window.pageYOffset || document.documentElement.scrollTop || body.scrollTop;
            var viewportHeight = getRegion().visibleHeight;
            var offsetParentLeft = 0;
            var temp = view_elements[count];
            do{
                if(!isNaN(temp.offsetLeft))
                {
                    offsetParentLeft += temp.offsetLeft;
                }
            }while(temp = temp.offsetParent);

            var pageXOffset =  window.pageXOffset || body.scrollLeft;
            var viewportWidth = getRegion().visibleWidth;

            if(offsetParentTop > pageYOffset &&
                offsetParentTop < pageYOffset + viewportHeight &&
                offsetParentLeft > pageXOffset &&
                offsetParentLeft < pageXOffset + viewportWidth){
                view_elements[count].src = view_elements[count].getAttribute("data-qazy-src");
                console.log(view_elements[count].src);
                view_elements.splice(count, 1);
                count--;
            }
        }
    }

    var addEvent = function(object, type, callback) {
        if (object == null || typeof(object) == 'undefined') return;
        if (object.addEventListener) {
            object.addEventListener(type, callback, false);
        } else if (object.attachEvent) {
            object.attachEvent("on" + type, callback);
        } else {
            object["on"+type] = callback;
        }
    };

    //resonsible for stopping img loading the image from server and also for displaying lazy loading image.
    var qazy_list_maker = function(){
        var elements = document.querySelectorAll("img[data-qazy][data-qazy='true']");
        for(var count = 0; count < elements.length; count++){
            view_elements.push(elements[count]);
            elements[count].setAttribute("data-qazy", "false");

            var source_url = elements[count].src;
            elements[count].setAttribute("data-qazy-src", source_url);

            elements[count].src = qazy_image;
        }
    }

    addEvent(window, "resize", reveal);
    addEvent(window, "scroll", reveal);

    var intervalObject = setInterval(function(){
        qazy_list_maker();
    }, 50);

    addEvent(window,'load', function(){
        clearInterval(intervalObject);
        qazy_list_maker();
        reveal();
    });
})();