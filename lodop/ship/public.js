function ecPrint(data){
    if(!LODOP){
        LODOP=getLodop(document.getElementById('LODOP_OB'),document.getElementById('LODOP_EM'));
    }
    var printerNo = getPrinterNo(data.order.sm_code);
    LODOP.PRINT_INITA("0cm","0cm","8.48cm","9cm","EZ-WMS");
    LODOP.ADD_PRINT_URL(0,0,'8cm',"9cm", lodopDomain+"/default/index/print-Order/code/"+data.order.order_code);

    LODOP.SET_PRINTER_INDEX(printerNo);
   // LODOP.PREVIEW();
    LODOP.PRINT();
}