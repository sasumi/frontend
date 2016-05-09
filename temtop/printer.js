/**
 * 打印控件LODOP的相关操作
 */
define('temtop/printer',function(require){
    var LODOP;
    var lodopCp = '北京中电亿商网络技术有限责任公司';
    var lodopKey = '653726081798577778794959892839';
    var lodopToken = '';
    var CreatedOKLodop7766=null;
    var TXT_INSTALL_TIPS = "本功能使用了CLodop云打印服务,请点击这里<a href='"+FRONTEND_HOST+"/lodop/CLodopPrint_Setup_for_Win32NT.exe' target='_blank'>下载</a>";
	var TXT_INSTALL_TIPS64 = "本功能使用了CLodop云打印服务,请点击这里<a href='"+FRONTEND_HOST+"/lodop/CLodopPrint_Setup_for_Win32NT.exe' target='_blank'>下载</a>";


    //====判断是否需要安装CLodop云打印服务器:====
    function needCLodop(){
        try{
            var ua=navigator.userAgent;
            if (ua.match(/Windows\sPhone/i) !=null) return true;
            if (ua.match(/iPhone|iPod/i) != null) return true;
            if (ua.match(/Android/i) != null) return true;
            if (ua.match(/Edge\D?\d+/i) != null) return true;
            if (ua.match(/QQBrowser/i) != null) return false;
            var verTrident=ua.match(/Trident\D?\d+/i);
            var verIE=ua.match(/MSIE\D?\d+/i);
            var verOPR=ua.match(/OPR\D?\d+/i);
            var verFF=ua.match(/Firefox\D?\d+/i);
            var x64=ua.match(/x64/i);
            if ((verTrident==null)&&(verIE==null)&&(x64!==null))
                return true; else
            if ( verFF !== null) {
                verFF = verFF[0].match(/\d+/);
                if ( verFF[0] >= 42 ) return true;
            } else
            if ( verOPR !== null) {
                verOPR = verOPR[0].match(/\d+/);
                if ( verOPR[0] >= 32 ) return true;
            } else
            if ((verTrident==null)&&(verIE==null)) {
                var verChrome=ua.match(/Chrome\D?\d+/i);
                if ( verChrome !== null ) {
                    verChrome = verChrome[0].match(/\d+/);
                    if (verChrome[0]>=42) return true;
                };
            };
            return false;
        } catch(err) {return true;};
    };


    var init = function(){
        //====页面引用CLodop云打印必须的JS文件：====
        if (needCLodop()) {
            //让其它电脑的浏览器通过本机打印（适用例子）：
            oscript = document.createElement("script");
            oscript.src ="http://localhost:8000/CLodopfuncs.js";
            var head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
            head.insertBefore( oscript,head.firstChild );
            //让本机浏览器打印(更优先)：
            var oscript = document.createElement("script");
            oscript.src ="http://localhost:8000/CLodopfuncs.js?priority=1";
            var head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
            head.insertBefore( oscript,head.firstChild );
        }else{
            LODOP=document.createElement("object");
            LODOP.setAttribute("width",0);
            LODOP.setAttribute("height",0);
            LODOP.setAttribute("style","position:absolute;left:0px;top:-100px;width:0px;height:0px;");
            LODOP.setAttribute("type","application/x-print-lodop");
            document.documentElement.appendChild(LODOP);
        }
    }

    var checkInstall = function(){
        var Popup = require("ywj/popup");
        try{ LODOP=getCLodop();} catch(err) {};
        if (!LODOP && document.readyState!=="complete") {alert("C-Lodop没准备好，请稍后再试！"); return;};
        if (!LODOP) {
            return false;
        } else {
            if (CLODOP.CVERSION<"2.0.3.5") {
                Popup.showAlert("安装提示",TXT_INSTALL_TIPS+"。或者<a href='"+url+"' target='_blank'>直接打印</a>");
            };
            //if (oEMBED && oEMBED.parentNode) oEMBED.parentNode.removeChild(oEMBED);
            //if (oOBJECT && oOBJECT.parentNode) oOBJECT.parentNode.removeChild(oOBJECT);
        };
        if ((LODOP==null)||(typeof(LODOP.VERSION)=="undefined")) {
            return false;
        } else if (LODOP.VERSION<"6.1.9.5") {
            return false;
        };
        LODOP.SET_LICENSES(lodopCp, lodopKey, lodopToken, "");
        return true;
    }

    var getLodop = function(){
        if (!checkInstall()){
            var Popup = require("ywj/popup");
            Popup.showAlert("安装提示",TXT_INSTALL_TIPS+"");
            return false;
            return false;
        }
        return LODOP;
    }

    var PRINTER_INDEX=0;
    var printURL = function(url,index,intOrient,width,height){
        if (!checkInstall()){
            var Popup = require("ywj/popup");
            Popup.showAlert("安装提示",TXT_INSTALL_TIPS+"。或者<a href='"+url+"' target='_blank'>直接打印</a>");
            return false;
        }
        if(!intOrient){
            intOrient = 1;
        }
        PRINTER_INDEX=(index==undefined)?0:index;
        var html = $.get(url,function(html){
            printHTML(html,intOrient,width,height);
        });
    }

    var printHTML = function(html,intOrient,width,height){
        LODOP.PRINT_INIT("");
        LODOP.SET_PRINT_MODE("WINDOW_DEFPRINTER",PRINTER_INDEX);
        LODOP.SET_PRINTER_INDEX(PRINTER_INDEX);
        var wt = '100%';
        var ht = '100%';
        if(width && height){
            wt = width;
            ht = height;
        }
        LODOP.ADD_PRINT_HTM(0,0,"100%","100%",html);
        LODOP.SET_PRINT_PAGESIZE(intOrient,wt,ht);
        LODOP.PRINT();
    }
	/** zwx 直接打印start **/

	/**
	*直接打印需设置打印机 index 本机打印机的序号
	*/
    var printURL_new = function(url,index,width,height,intOrient){
		//debugger
		if (!checkInstall()){
			var Popup = require("ywj/popup");
			Popup.showAlert("安装提示",TXT_INSTALL_TIPS+"。或者<a href='"+url+"' target='_blank'>直接打印</a>");
			return false;
		}
		PRINTER_INDEX=(index==undefined)?0:index;
		var html = $.get(url,function(html){
			printHTML_new(html,width,height,intOrient);
		});


        return false;

    }
    var printHTML_new = function(html,intOrient,width,height){
        LODOP.PRINT_INIT("");
        LODOP.SET_PRINT_MODE("WINDOW_DEFPRINTER",PRINTER_INDEX);
        LODOP.SET_PRINTER_INDEX(PRINTER_INDEX);
        var wt = '100%';
        var ht = '100%';
        if(!intOrient){
            intOrient = 1;
        }
        if(width && height){
            wt = width;
            ht = height;
        }
        LODOP.SET_PRINT_STYLE("FontSize",18);
        LODOP.SET_PRINT_STYLE("Bold",0);
        LODOP.ADD_PRINT_HTM(0,0,"100%","100%",html);
        LODOP.SET_PRINT_PAGESIZE(intOrient,wt,ht);
        LODOP.PRINT();
    }
	/** zwx 直接打印end **/

        //打印图片
    var printImg = function(src,index,bathpath){
        if (!checkInstall()){
            var Popup = require("ywj/popup");
            Popup.showAlert("安装提示",TXT_INSTALL_TIPS+"。或者<a href='"+url+"' target='_blank'>直接打印</a>");
            return false;
        }
        PRINTER_INDEX=(index==undefined)?0:index;
        LODOP.PRINT_INIT("");
        LODOP.SET_PRINT_MODE("WINDOW_DEFPRINTER",PRINTER_INDEX);
        LODOP.SET_PRINTER_INDEX(PRINTER_INDEX);
        for(var x in src){
            //http://sz.wms.temtop.com/upload/
            //document.write(bathpath+src[x]);return false;
            LODOP.SET_PRINT_PAGESIZE(1,800,900);
            LODOP.ADD_PRINT_IMAGE('3mm','2mm','80mm','90mm',"<img  src='"+bathpath+src[x]+"' />");
            LODOP.SET_PRINT_STYLEA(0,"Stretch",1);//按原图比例(不变形)缩放模式
            LODOP.PRINT();
        }
    }

    init();
    return {
        checkInstall: checkInstall,
        getLodop: getLodop,
        printURL: printURL,
        printHTML: printHTML,
		printURL_new:printURL_new,
		printHTML_new:printHTML_new,
        printImg: printImg
    };
});