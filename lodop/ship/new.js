function ecPrint(data){
    if(!LODOP){
        LODOP=getLodop(document.getElementById('LODOP_OB'),document.getElementById('LODOP_EM'));
    }
    var l=-1.5,t=0;
    var printerNo = getPrinterNo('SF');


LODOP.PRINT_INITA("0cm","0cm","8.47cm","9cm","套打EMS的模板");
LODOP.ADD_PRINT_SETUP_BKIMG("C:\\Users\\mominy\\Desktop\\sm2.png");
LODOP.ADD_PRINT_TEXT("0.24cm","0.34cm","6.4cm","0.53cm","Return Mail Address:");
LODOP.ADD_PRINT_TEXT("0.71cm","0.34cm","8.7cm","0.53cm","回邮收件人");
LODOP.ADD_PRINT_TEXT("1.19cm","0.34cm","8.73cm","1.16cm","回邮地址 safd fdsa fdsaf dsafdsa f...(省略)");
LODOP.ADD_PRINT_TEXT("2.7cm","0.32cm","8.73cm","0.66cm","TO: Kim");
LODOP.SET_PRINT_STYLEA(0,"FontName","Verdana");
LODOP.SET_PRINT_STYLEA(0,"FontSize",12);
LODOP.SET_PRINT_STYLEA(0,"Bold",1);
LODOP.ADD_PRINT_TEXT("3.31cm","0.32cm","8.7cm","0.66cm","Tel: 150000000");
LODOP.SET_PRINT_STYLEA(0,"FontName","Verdana");
LODOP.SET_PRINT_STYLEA(0,"FontSize",12);
LODOP.SET_PRINT_STYLEA(0,"Bold",1);
LODOP.ADD_PRINT_TEXT("4cm","0.69cm","8.78cm","1.64cm","address1");
LODOP.SET_PRINT_STYLEA(0,"FontName","Verdana");
LODOP.SET_PRINT_STYLEA(0,"Bold",1);
LODOP.ADD_PRINT_SHAPE(4,"6.46cm","0.26cm","8.07cm","0.05cm",0,1,"#000000");
LODOP.ADD_PRINT_SHAPE(4,"8.41cm","0.24cm","8.07cm","0.05cm",0,1,"#000000");
LODOP.ADD_PRINT_BARCODE("7.17cm","0.66cm","7.62cm","1.11cm","","123456789012");
LODOP.SET_PRINT_STYLEA(0,"ShowBarText",0);
LODOP.ADD_PRINT_TEXT("6.64cm","2.59cm","6.4cm","0.58cm","1212323423232322");
LODOP.SET_PRINT_STYLEA(0,"FontName","Verdana");
LODOP.SET_PRINT_STYLEA(0,"FontSize",10);
LODOP.SET_PRINT_STYLEA(0,"Bold",1);
LODOP.ADD_PRINT_TEXT("8.55cm","0.21cm","2.65cm","0.53cm","smCode");
LODOP.SET_PRINT_STYLEA(0,"FontName","Verdana");
LODOP.SET_PRINT_STYLEA(0,"Bold",1);
LODOP.ADD_PRINT_TEXT("8.52cm","4.39cm","4cm","0.66cm","RefNo:SOEC0011307200007");
LODOP.SET_PRINT_STYLEA(0,"FontName","Verdana");


    LODOP.SET_PRINTER_INDEX(printerNo);
    LODOP.PREVIEW();
}