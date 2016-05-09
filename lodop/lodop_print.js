var lodopRegister = 1;//lodop是否注册
var lodopDomain = 'http://'+window.location.host+'/temtop/';
//var lodopDomain = 'http://'+window.location.host+'/tterp/';
var cookieDomain = 'temtop.com';
//以上信息需预先设定

var winW = 0;// 屏幕宽度
var winH = 0;// 屏幕高度

var LODOP = false;
var printers = {};
var shipping_method = ["A4"];
function setupPrinter() {
	window.location.href=lodopDomain+"public/index.php/printerset";
}
function setPrintDialog() {
    setupPrinter();
}

// 打印机设置
function printerSetup() {
    try {
        LODOP = getLodop(document.getElementById('LODOP_OB'), document.getElementById('LODOP_EM'));
        if ((LODOP == null) || (typeof(LODOP.VERSION) == "undefined")) {
            alert("本机未安装Lodop或需要升级");
            return;
        }
    } catch (err) {
        alert("本机未安装过Lodop控件");
        return;
    }
    setPrintDialog();
}

// 保存打印机设置
function savePrinter() {
    if ($(".printer").size() > 0) {
        $(".printer").each(function () {
            var paper = this.id;
            var val = $(this).val();
            // $.cookie(paper, val, {expires: 365, domain: cookieDomain, path: '/'});
            $.cookie(paper, val, {expires: 365, path: '/'});
        });
    }
    $.cookie("wmsPrinterOk", "1", {expires: 365, path: '/'});// 打印机设置成功
    //alertTip('打印机设置成功');
    packOperation(1);
    printerShow('');
}

// 获取打印机

function getPrinterName(type) {
    if (!LODOP) {
        LODOP = getLodop(document.getElementById('LODOP_OB'), document.getElementById('LODOP_EM'));
    }
    var printerNo = $.cookie(type);
    if (printerNo !== null) {
        return LODOP.GET_PRINTER_NAME(printerNo);
    }
    return false;
}

function getPrinterNo(type) {
    return $.cookie(type);
}



function printUrl(url,setWidth,setHeight,top,left) {
    if (!LODOP) {
        LODOP = getLodop(document.getElementById('LODOP_OB'), document.getElementById('LODOP_EM'));
    }
    var printerNo = getPrinterNo('A4');
    LODOP.PRINT_INITA(top,left,setWidth,setHeight,"EZ-WMS");
    LODOP.ADD_PRINT_URL(top,left,setWidth,setHeight, lodopDomain+"/"+url);
    LODOP.SET_PRINTER_INDEX(printerNo);
    LODOP.SET_LICENSES(lodopCp, lodopKey, lodopToken, "");
    // LODOP.PREVIEW();
    LODOP.PRINT();
}

function printUrlForPrinter(url, setWidth, setHeight, top, left, printerNo) {
    if (!LODOP) {
        LODOP = getLodop(document.getElementById('LODOP_OB'), document.getElementById('LODOP_EM'));
    }
    printerNo = printerNo == undefined || printerNo == '' ? 'A4' : printerNo;
    var printerCode = getPrinterNo(printerNo);
    LODOP.PRINT_INITA(top, left, setWidth, setHeight, "EZ-WMS");
    LODOP.ADD_PRINT_URL(top, left, setWidth, setHeight, lodopDomain + "/" + url);
    LODOP.SET_PRINTER_INDEX(printerCode);
    LODOP.SET_LICENSES(lodopCp, lodopKey, lodopToken, "");
    // LODOP.PREVIEW();
    LODOP.PRINT();
}
function printUrlForPrinterTable(url, setWidth, setHeight, top, left, printerNo) {
    if (!LODOP) {
        LODOP = getLodop(document.getElementById('LODOP_OB'), document.getElementById('LODOP_EM'));
    }
    printerNo = printerNo == undefined || printerNo == '' ? 'A4' : printerNo;
    var printerCode = getPrinterNo(printerNo);
    LODOP.PRINT_INITA(top, left, setWidth, setHeight, "EZ-WMS");
    //LODOP.ADD_PRINT_URL(top, left, setWidth, setHeight, lodopDomain + "/" + url);
    LODOP.ADD_PRINT_TBURL(top,left,setWidth,setHeight,lodopDomain + "/" + url);  //按URL地址打印
    //LODOP.ADD_PRINT_URL(top, left, setWidth, setHeight, "http://www.sina.com");
    LODOP.SET_PRINTER_INDEX(printerCode);
    LODOP.SET_LICENSES(lodopCp, lodopKey, lodopToken, "");
    //LODOP.PREVIEW();
    LODOP.PRINT();
}

function initSet() {
    if ($.cookie('wmsPrinterOk') != 1 || $.cookie('wmsPrinterOk') == null) {
        packOperation(0);
        printerSetup();//打印机设置
    }
    if ($.cookie('wmsPrinterOk') != 1 && (LODOP != null) && (typeof(LODOP.VERSION) != "undefined") && !$("#dialog-auto-alert-tip").dialog('isOpen')) {
        packOperation(0);
        setPrintDialog();
    }
}

function packOperation(s) {
    if (s == '1') {
        $("#pack-operation-area").show();
        if ($("#pickingCode", "#searchForm")) {
            $("#pickingCode", "#searchForm").focus().select();
        }
        if ($("#orderCode", "#searchForm")) {
            $("#orderCode", "#searchForm").focus().select();
            return false;
        }

    } else {
        printerShow('您还没有设置打印机,请设置!');
        $("#pack-operation-area").hide();
    }
}

function printerShow(html) {
    $("#printSet-tip").html(html);
}


$(function () {
    winW = window.screen.availWidth;// 初始化
    winH = window.screen.availHeight;// 初始化
    var is_lodop_init = $("#lodop_init").val();
    if(is_lodop_init != 0){
        setTimeout(initSet, 50);
    }
    $("#unifiedSetPrint").live('change',function(){
        var val = $(this).val();
        $(".printer","#printer_list").val(val);
    });
});