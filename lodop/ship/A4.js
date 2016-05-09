function ecPrint(data){
    if(!LODOP){
        LODOP=getLodop(document.getElementById('LODOP_OB'),document.getElementById('LODOP_EM'));
    }
    var l=-1.5,t=0;
    var printerNo = getPrinterNo('A4');

    LODOP.PRINT_INITA("0mm","0mm","241mm","153mm","打印物流单"+data.order.order_code);
    LODOP.SET_PRINT_PAGESIZE(1,'241mm','153mm','TOLL');
//LODOP.ADD_PRINT_IMAGE("0","0","241mm","153mm","<img src='"+lodopDomain+"/lodop/sf.jpg'/>");
    LODOP.SET_PRINT_STYLEA(0,"FontName","verdana");
    LODOP.SET_PRINT_STYLEA(0,"FontSize",8);
    var product_contents = '';
    var product_count = 0;
    var order_weight = 0;

    LODOP.ADD_PRINT_TEXT((54.7+l)+"mm",(169.9+t)+"mm","50.5mm","14.4mm",'打印物流单'+data.order.order_code);
    LODOP.SET_PRINT_STYLEA(0,"FontName","Verdana");
    LODOP.SET_PRINT_STYLEA(0,"FontSize",8);
    LODOP.ADD_PRINT_TEXT((75.1+l)+"mm",(173.4+t)+"mm","14.6mm","5.3mm",'打印物流单');
    LODOP.SET_PRINT_STYLEA(0,"FontName","verdana");
    LODOP.SET_PRINT_STYLEA(0,"FontSize",8);

    LODOP.SET_PRINTER_INDEX(printerNo);
    LODOP.PREVIEW();
}