/*
YWJ javascript library
*/

define('ywj/auto',function(require){
var util=require('ywj/util');
var net=require('ywj/net');
var $=require('jquery');
var EVENT_BINDED=false;
var MSG_SHOW_TIME=(function(){
return $.extend({
err:1,
succ:1,
tip:1
},window['MSG_SHOW_TIME']||{});
})();
var MSG_LOAD_TIME=10000;
var DEF_POPUP_WIDTH=600;
var top_doc;
var top_win;
try{
if(parent.document&&location.host==parent.document.location.host){
top_doc=parent.document;
top_win=parent;
}
}catch(ex){
}
top_doc=top_doc||document;
top_win=top_win||window;
var showMsg=function(message,type,time){
type=type||'err';
require.async('ywj/msg',function(Msg){
Msg.show(message,type,time||MSG_SHOW_TIME[type]);
});
};
var hideMsg=function(){
require.async('ywj/msg',function(Msg){
Msg.hide();
});
};
var showPopup=function(conf,onSuccess,onError){
require.async('ywj/popup',function(Pop){
var p=new Pop(conf);
if(onSuccess){
p.listen('onSuccess',onSuccess);
}
if(onError){
p.listen('onError',onError);
}
p.show();
});
};
var auto_process_async=function(node,rsp){
node=$(node);
var onrsp=node.attr('onresponse');
var onsucc=node.attr('onsuccess');
rsp=rsp||{};
rsp.message=rsp.message||'系统繁忙，请稍后(-1)';
rsp.code=rsp.code===undefined?-1:rsp.code;
console.log('RSP:',rsp);
if(onrsp){
eval('var fn = window.'+onrsp+';');
fn.call(node,rsp);
}else if(onsucc){
if(rsp.code==0){
showMsg(rsp.message,'succ');
setTimeout(function(){
eval('var fn = window.'+onsucc+';');
fn.call(node,rsp);
},MSG_SHOW_TIME.succ*1000);
}
else{
showMsg(rsp.message);
}
}
else{
showMsg(rsp.message,rsp.code?'err':'succ');
if(rsp.code==0){
setTimeout(function(){
if(rsp.jump_url){
top_win.location.href=rsp.jump_url;
}else{
top_win.location.reload();
}
},MSG_SHOW_TIME.succ*1000);
}
}
};
var checkConfirm=function(node){
var msg=$(node).data('confirm');
var ret=!(msg&&!confirm(msg));
if(!ret){
var event=window.event;
if(event.preventDefault){
event.preventDefault();
}else{
event.returnValue=false;
}
}
return ret;
};
var bindEvent=function(){
if(EVENT_BINDED){
return;
}
EVENT_BINDED=true;
var $body=$('body');
$body.delegate('a[rel=popup]','click',function(){
if(!checkConfirm(this)){
return;
}
var node=$(this);
var src=net.mergeCgiUri(node.attr('href'),{'ref':'iframe'});
var width=parseFloat(node.data('width'))||DEF_POPUP_WIDTH;
var height=parseFloat(node.data('height'))||0;
var title=node.attr('title')||node.html()||'';
var onSuccess=node.data('onsuccess');
if(onSuccess){
eval('var fn1 = window.'+onSuccess);
onSuccess=fn1;
}else{
onSuccess=function(){};
}
var onError=node.data('onerror');
if(onError){
eval('var fn2 = window.'+onError);
onError=fn2;
}else{
onError=function(){};
}
var conf={
title:title,
content:{src:src},
width:width,
moveEnable:true,
topCloseBtn:true,
buttons:[]
};
if(height){
conf.height=height;
}
showPopup(conf,function(){
return onSuccess.apply(node,util.toArray(arguments));
},onError);
if(this.tagName=='A'){
return false;
}
});
$body.delegate('*[rel=msg]','click',function(){
var msg=$(this).data('msg')||$(this).attr('title');
if(msg){
showMsg(msg,'tip');
}
});
$body.delegate('a[rel=async]','click',function(){
if(!checkConfirm(this)){
return;
}
var _this=this;
var link=$(this);
var url=link.attr('href');
if(url){
showMsg('正在提交请求...','load',MSG_LOAD_TIME);
url=net.mergeCgiUri(url,{ref:'json'});
net.get(url,null,function(rsp){
hideMsg();
auto_process_async(_this,rsp);
});
return false;
}
});
$body.delegate('*[rel=anchor-slide]','click',function(){
var _this=$(this);
var time=_this.attr("slide-time")||1000;
var direction=_this.attr("slide-direction")||"0";
var _rel=_this.attr("href").substr(1);
var $target=$("#"+_rel);
switch(direction){
case 1:
var _targetLeft=$target.offset().left;
$("html,body").animate({scrollLeft:_targetLeft},time);
break;
default:
var _targetTop=$target.offset().top;
$("html,body").animate({scrollTop:_targetTop},time);
break;
}
return false;
});
var $accessory_key_dom=$('*[data-accessory-key]',$body);
if($accessory_key_dom.size()){
require.async('jquery/hotkeys',function(){
var exist_keys={};
$accessory_key_dom.each(function(){
var $node=$(this);
var k=$node.data('accessory-key');
if(exist_keys[k]){
return;
}
exist_keys[k]=true;
$body.bind('keydown',k,function(){
$node[0].click();
return false;
});
});
});
}
$body.delegate('*[rel=selector]','click',function(){
var tag=$(this).data('target')||'body';
if(tag){
var toState=$(this).data('flag')===undefined||$(this).data('flag')=='1';
if(this.type=='checkbox'){
toState=this.checked;
}
$('input[type=checkbox]',$(tag)).attr('checked',toState).trigger('change');
}
});
$body.delegate('*[data-confirm]','click',function(){
if(!this.rel&&!checkConfirm(this)){
return false;
}
});
$body.delegate('select[rel=popup]','change',function(){
var node=$(this);
var val=node.val();
var opt=$(this.options[this.selectedIndex]);
var ti=opt.attr('title')||opt.text()||opt.attr('name');
var ex_type=opt.attr('rel')||'popup';
var w=parseInt(opt.data('width'),10)||DEF_POPUP_WIDTH;
var h=parseInt(opt.data('height'),10)||0;
if(val){
if(!checkConfirm(opt)){
return;
}
if(ex_type=='popup'){
showPopup({
title:ti,
content:{src:val},
width:w,
height:h
});
}else if(ex_type=='async'){
showMsg('提交数据中...','load',MSG_LOAD_TIME);
net.get(val,{ref:'json'},function(rsp){
hideMsg();
auto_process_async(opt[0],rsp);
});
}
this.selectedIndex=0;
}
});
$body.delegate('*[rel=async-submit]','click',function(){
var target=$(this).data('target');
var action=$(this).data('action');
var method=$(this).data('method')||'get';
if(!target||!action){
return;
}
if(!checkConfirm(this)){
return;
}
var _this=this;
var data=util.getFormData($(target));
showMsg('正在提交请求...','load',MSG_LOAD_TIME);
net[method](action,data,function(rsp){
hideMsg();
auto_process_async(_this,rsp);
});
return false;
});
(function(){
$body.delegate('*[rel=row-delete-btn]','click',function(){
var allow_empty=$(this).data('allow-empty')=='1';
var row=$(this).parentsUntil('tr').parent();
require.async('ywj/table',function(T){
T.deleteRow(row,allow_empty);
});
});
$body.delegate('*[rel=row-up-btn]','click',function(){
var row=$(this).parentsUntil('tr').parent();
require.async('ywj/table',function(T){
T.moveUpRow(row);
});
});
$body.delegate('*[rel=row-down-btn]','click',function(){
var row=$(this).parentsUntil('tr').parent();
require.async('ywj/table',function(T){
T.moveDownRow(row);
});
});
$body.delegate('*[rel=row-append-btn]','click',function(e){
var tmp=$(this).parentsUntil('table');
var table=tmp.parent();
var tbl=$('tbody',table);
var tpl=$(this).data('tpl');
require.async('ywj/table',function(T){
T.appendRow($('#'+tpl).text(),tbl);
});
e.stopPropagation();
});
})();
if($('*[rel=tooltip]').length>0){
require.async('ywj/tooltip',function(){
$('[rel=tooltip]').tooltip({
position:{
my:"center bottom-20",
at:"center top",
using:function(position,feedback){
$(this).css(position);
$("<div>")
.addClass("ui-tooltip-arrow")
.addClass(feedback.vertical)
.addClass(feedback.horizontal)
.appendTo(this);
}
}
}
);
});
}
if($('*[rel=img-slide]').length>0){
require.async('ywj/imgslide',function(slide){
slide.init();
});
}
var _TIME_N_CHK='date-widget-bind';
$.each(['input.date-time-txt','input.date-txt','input[type=time]'],function(idx,s){
if($(s).size()){
require.async('ywj/timepicker');
}
$body.delegate(s,'focus',function(){
var $this=$(this);
if($this.data(_TIME_N_CHK)){
return;
}
var current_timestamp=$.now();
var enable_past_duration=parseInt($this.data("enable-past-duration"))*1000;
var enable_future_duration=parseInt($this.data("enable-future-duration"))*1000;
var min_date=new Date(current_timestamp+enable_past_duration);
var max_date=new Date(current_timestamp+enable_future_duration);
require.async('ywj/timepicker',function(){
if(s.indexOf('date-time')>=0){
$this.datetimepicker({dateFormat:'yy-mm-dd',timeFormat:'HH:mm:ss',minDateTime:min_date,maxDateTime:max_date});
}
else if(s.indexOf('date')>=0){
$this.datepicker({dateFormat:'yy-mm-dd',minDateTime:min_date,maxDateTime:max_date});
}
else if(s.indexOf('time')>0){
$this.timepicker({timeFormat:'HH:mm',minDateTime:min_date,maxDateTime:max_date});
}
if(!$this.data(_TIME_N_CHK)){
$this.data(_TIME_N_CHK,1);
$this.trigger('focus');
}
});
});
});
var beforeunloadPromptFunc=function(){
if(window['BEFORE_UNLOAD_PROMOTE_SW']&&window['EDITOR_CONTENT_CHANGED_FLAG']){
return'您输入的内容尚未保存，确定离开此页面吗？';
}
};
$(window).bind('beforeunload',beforeunloadPromptFunc);
$('form').submit(function(){
$(window).unbind('beforeunload',beforeunloadPromptFunc);
});
};
var handler=function(){
var FLAG_SUBMITTING='submitting';
var FLAG_ASYNC_BIND='async-bind';
$('form[rel=async]').each(function(){
if(this.target){
return;
}
var $form=$(this);
$form.on('submit',function(){
if($form.data(FLAG_SUBMITTING)){
return false;
}
if(!$form.data(FLAG_ASYNC_BIND)){
if($form.attr('method').toLowerCase()=='get'){
$('<input type="hidden" name="ref" value="formsender" />').appendTo($form);
}else{
$form.attr('action',net.mergeCgiUri($form.attr('action'),{ref:'formsender'}));
}
$form.data(FLAG_ASYNC_BIND,1);
}
var frameId='FormSubmitIframe'+util.guid();
var span=document.createElement('span');
span.innerHTML='<iframe id="'+frameId+'" name="'+frameId+'" style="display:none"></iframe>';
document.body.appendChild(span);
var frame=document.getElementById(frameId);
frame._callback=function(rsp){
setTimeout(function(){
$form.removeData(FLAG_SUBMITTING);
},1500);
hideMsg();
$(frame).remove();
auto_process_async($form,rsp);
};
$form.attr('target',frameId);
$form.data(FLAG_SUBMITTING,'1');
showMsg('正在提交请求...','load',MSG_LOAD_TIME);
});
});
$('table').each(function(){
if($(this).data('empty-fill')){
var empty=$('tr td',this).size()==0;
if(empty){
var cs=$('tr>td',this).size()||$('tr>th',this).size();
var con=$('tbody',this).size()?$('tbody',this):$(this);
$('<tr class="row-empty"><td colspan="'+(cs||1)+'"><div class="data-empty">没有数据</div></td></tr>').appendTo(con);
}
}
if($(this).data('row-check')){
$('td',this).on('click',function(ev){
var tag=ev.target.tagName;
if(/^(A|INPUT|TEXTAREA|BUTTON|LABEL|SELECT)$/.test(tag)){
return;
}
var chk=$('input[type=checkbox]:first',this);
if(chk.size()){
chk.attr('checked',!chk.attr('checked'));
}
});
}
});
$('input[rel=upload-image]').each(function(){
if($(this).data('upload-image-binded')){
return;
}
$(this).data('upload-image-binded',1);
var _this=this;
require.async('ywj/simpleimageuploader',function(UP){
var a=new UP($(_this),{
UPLOAD_URL:window.UPLOAD_URL,
PROGRESS_URL:window.UPLOAD_PROGRESS_URL
});
});
});
$('input[rel=upload-file]').each(function(){
if($(this).data('upload-file-binded')){
return;
}
$(this).data('upload-file-binded',1);
var _this=this;
require.async('ywj/simplefileuploader',function(UP){
var a=new UP($(_this),{
UPLOAD_URL:window.UPLOAD_URL,
PROGRESS_URL:window.UPLOAD_PROGRESS_URL
});
});
});
$('textarea[rel=rich]').each(function(){
if($(this).data('rich-binded')){
return;
}
$(this).data('rich-binded',1);
var txt=$(this);
var id=util.guid();
var name=txt.attr('name');
var w=txt.width()||400;
var h=txt.height()||300;
txt.hide();
var script='<script id="'+id+'" name="'+name+'" type="text/plain" style="width:'+w+'px; height:'+h+'px;"></script>';
$(script).insertAfter(txt);
require.async('ueditor_admin_config',function(){
require.async('ueditor',function(){
var ue=UE.getEditor(id);
setTimeout(function(){
ue.setContent(txt.val());
ue.setHeight(h+'px');
ue.addListener("contentchange",function(){
window['EDITOR_CONTENT_CHANGED_FLAG']=true;
});
},1000);
});
});
});
$('form').each(function(){
if($(this).data('form-get-fixed')){
return;
}
$(this).data('form-get-fixed',1);
if(!this.method||(this.method.toLowerCase()=='get'&&this.action.indexOf('?')>=0)){
var action=this.action;
var query_str=action.substring(action.lastIndexOf("?")+1,action.length);
var query_arr=query_str.split('&');
for(var i=0;i<query_arr.length;i++){
var tmp=query_arr[i].split('=');
$(this).prepend('<input name="'+escape(decodeURIComponent(tmp[0]))+'" type="hidden" value="'+escape(decodeURIComponent(tmp[1]))+'" />');
}
}
});
$('*[data-unselectable]').each(function(){
util.setNodeSelectDisabled(this);
});
if($('select[rel=province-selector]').size()){
require.async('ywj/areaselector');
}
var $fixed_els=$('*[data-fixed]',$('body'));
if($fixed_els.size()){
$('<style>.fixed-top-element {position:absolute; top:0; left:0; width:100%; z-index:10}</style>').appendTo($('head'));
$fixed_els.each(function(){
var guid=util.guid();
$(this).data('fixed-shadow-id',guid);
$(this).data('org-top',$(this).position().top);
var shadow=$('<div id="'+guid+'"></div>');
shadow.css({
'display':'none',
'height':$(this).outerHeight()+'px',
'width':'100%'
});
shadow.insertAfter(this);
});
var hd=function(){
var scroll_top=$(window).scrollTop();
$fixed_els.each(function(){
var $shadow=$('#'+$(this).data('fixed-shadow-id'));
if($(this).data('org-top')<scroll_top){
$(this).addClass('fixed-top-element');
$(this).css('top',scroll_top);
$shadow.show();
}else{
$(this).css('top','auto');
$(this).removeClass('fixed-top-element');
$shadow.hide();
}
});
};
$(window).scroll(hd);
hd();
}
};
$(function(){
bindEvent();
handler();
});
});
(function(scope){
var __remove_css_class=function(c,node_class){
var r=new RegExp('(\\s|^)'+c+'(\\s|$)','g');
return node_class.replace(r,' ');
};
var __img_scale__=function(opt,org_region){
var w=org_region.width,
h=org_region.height;
var ml=0,mt=0,
scale=1,scalew,scaleh;
if(opt.zoom_out===undefined){
opt.zoom_out=true;
}
if(opt.minWidth||opt.minHeight){
scalew=opt.minWidth/w;
scaleh=opt.minHeight/h;
if(!opt.zoom_out&&scalew>1&&scaleh>1){
scalew=scaleh=1;
}
scale=Math.max(scalew,scaleh);
w=w*scale;
h=h*scale;
ml=-(w-opt.minWidth)/2;
mt=-(h-opt.minHeight)/2;
}else{
scalew=opt.maxWidth/w;
scaleh=opt.maxHeight/h;
if(!opt.zoom_out&&scalew>1&&scaleh>1){
scalew=scaleh=1;
}
scale=Math.min(scalew,scaleh);
w=w*scale;
h=h*scale;
ml=(opt.maxWidth-w)/2;
mt=(opt.maxHeight-h)/2;
}
return{
width:parseInt(w,10)+'px',
height:parseInt(h,10)+'px',
marginLeft:parseInt(ml,10)+'px',
marginTop:parseInt(mt,10)+'px'
};
};
var __img_adjust__=function(img){
var zoom_out=img.getAttribute('data-zoom-out');
zoom_out=(zoom_out==null)?true:(zoom_out!='0');
if(img.getAttribute('data-img-miss')=='1'){
img.parentNode.className=__remove_css_class('g-img-error',img.parentNode.className);
img.parentNode.className+=' g-img-miss';
img.style.width='auto';
img.style.height='auto';
var ph=img.parentNode.offsetHeight;
var pw=img.parentNode.offsetWidth;
var h=img.height;
var w=img.width;
if(ph>h){
img.style.marginTop=parseInt((ph-h)/2,10)+'px';
}
}else{
img.style.marginTop='0';
var c=__remove_css_class('g-img-error',img.parentNode.className);
img.parentNode.className=__remove_css_class('g-img-miss',c);
var minw=img.getAttribute('data-min-width');
var minh=img.getAttribute('data-min-height');
var maxw=img.getAttribute('data-max-width');
var maxh=img.getAttribute('data-max-height');
if(minw||minh||maxw||maxh){
img.style.height='auto';
img.style.width='auto';
var scale_style=__img_scale__({
minWidth:minw,
minHeight:minh,
maxWidth:maxw,
maxHeight:maxh,
zoom_out:zoom_out
},{width:img.width,height:img.height});
for(var i in scale_style){
img.style[i]=scale_style[i];
}
}
}
};
var __img_error__=function(img){
var c=img.parentNode.className;
if(img.getAttribute('src')){
c=__remove_css_class('g-img-miss',c);
c+=' g-img-error';
}else{
c=__remove_css_class('g-img-error',c);
c+=' g-img-miss';
}
img.parentNode.className=c;
};
scope.__img_adjust__=__img_adjust__;
scope.__img_error__=__img_error__;
scope.__img_scale__=__img_scale__;
})(window);
define('ywj/imagescale',function(){
return{
scale:__img_scale__,
onLoad:__img_adjust__,
onError:__img_error__
};
});
define('ywj/masker',function(require){
var $=require('jquery');
var util=require('ywj/util');
var MASKER_STYLE_ID='__MASKER_STYLE__';
var MASKER_CLASS='YWJ_MAKSER';
var MASKER_STYLESHEET='.'+MASKER_CLASS+'{position:absolute;top:0;left:0;width:100%;background-color:#ccc;z-index:100;opacity:0.5; filter: alpha(opacity=50);}';
var MASKER_DOM;
return{
show:function(styleConfig){
if(!MASKER_DOM){
$('<style id="'+MASKER_STYLE_ID+'">'+MASKER_STYLESHEET+'</style>').appendTo($('head'));
MASKER_DOM=$('<div class="'+MASKER_CLASS+'"></div>').appendTo($('body'));
if(styleConfig){
$.each(styleConfig,function(key,val){
MASKER_DOM.css(key,val);
});
}
}
var winRegion=util.getRegion();
MASKER_DOM.css('height',winRegion.documentHeight);
MASKER_DOM.show();
},
hide:function(){
if(MASKER_DOM){
MASKER_DOM.hide();
}
}
};
});
define('ywj/msg',function(require){
var $=require('jquery');
var util=require('ywj/util');
var msg_css_url=seajs.resolve('ywj/resource/msg.css');
var top_doc;
var top_win;
try{
top_doc=parent.document;
top_win=parent;
}catch(ex){}
top_doc=top_doc||document;
top_win=top_win||window;
$('head',top_doc).append('<link rel="stylesheet" type="text/css" href="'+msg_css_url+'"/>');
if(top_win['__YWJ_MSG__']){
return top_win['__YWJ_MSG__'];
}
var MSG_CONTAINER=null;
var Msg=function(arg1,type,time,closeCallback){
this.guid='_tip_'+util.guid();
this.container=MSG_CONTAINER;
var cfg=arg1;
if(typeof(arg1)=='string'){
cfg={
'msg':arg1,
'type':type||'tip',
'time':(time>0?time*1000:2000)
};
}
this.config=$.extend({
'msg':'',
'type':0,
'time':2000,
'auto':true,
'callback':closeCallback
},cfg);
if(this.config.auto){
this.show();
var _this=this;
if(this.config.time){
var call='var a = document.getElementById("'+this.guid+'"); if(a){a.style.display = "none";}';
top_win.setTimeout(call,this.config.time);
}
}
};
Msg.prototype.show=function(){
if(!this.container){
this.container=MSG_CONTAINER=$('<div class="ywj-msg-container-wrap"></div>').appendTo($('body',top_doc));
}
this.container.attr('id',this.guid);
var html=([
'<span class="ywj-msg-container">',
'<span class="ywj-msg-icon-',this.config.type,'"><i></i></span>',
'<span class="ywj-msg-content">',this.config.msg,'</span>',
'</div>'
]).join('');
if($.browser.ie6Compat){
var viewP=util.getRegion(top_win);
this.container.setStyle('top',viewP.visibleHeight/2+viewP.verticalScroll);
}
this.container.html(html);
this.container.show();
};
Msg.prototype.hide=function(){
if(this.container){
this.container.hide();
this.config.callback&&this.config.callback(this);
}
};
Msg.hide=function(){
if(MSG_CONTAINER){
MSG_CONTAINER.hide();
}
};
Msg.show=function(arg1,type,time){
return new Msg(arg1,type,time);
};
Msg.prototype.destroy=function(){
this.container.remove();
};
if(!top_win['__YWJ_MSG__']){
top_win['__YWJ_MSG__']=Msg;
}
return Msg;
});
define('ywj/net',function(require){
var $=require('jquery');
var util=require('ywj/util');
var msg=require('ywj/msg');
var getParam=function(param,url){
var r=new RegExp("(\\?|#|&)"+param+"=([^&#]*)(&|#|$)");
var m=(url||location.href).match(r);
return(!m?"":m[2]);
};
var getHash=function(){
var url=location.hash;
if(url[0]=='#'){
url=url.substr(1);
}
var found=false;
var ret={};
var ps=url.indexOf('&')>=0?url.split('&'):[url];
for(var i=0;i<ps.length;i++){
var sep=ps[i].indexOf('=');
var k,v;
if(sep){
k=decodeURIComponent(ps[i].substr(0,sep));
v=decodeURIComponent(ps[i].substr(sep+1));
}
if(k){
ret[k]=v;
found=true;
}
}
return found?ret:null;
};
var setHash=function(k,v){
var ps=getHash()||{};
var s=[];
delete(ps[k]);
ps[k]=v;
for(var t in ps){
if(ps[t]!==null){
s.push(encodeURIComponent(t)+'='+encodeURIComponent(ps[t]));
}else{
s.push(encodeURIComponent(t));
}
}
if(s.length){
location.hash='#'+s.join('&');
}else{
location.hash='';
}
};
var fixType=function(val){
return typeof(val)=='string'||typeof(val)=='number';
};
var buildParam=function(){
var data=[];
var args=util.toArray(arguments);
$.each(args,function(k,val){
var params=val;
if(util.isArray(params)){
data.push(params.join('&'));
}else if(typeof(params)=='object'){
for(var i in params){
if(fixType(params[i])){
data.push(i+'='+encodeURIComponent(params[i]));
}
}
}else if(typeof(params)=='string'){
data.push(params);
}
});
return data.join('&').replace(/^[?|#|&]{0,1}(.*?)[?|#|&]{0,1}$/g,'$1');
};
var mergeCgiUri=function(){
var args=util.toArray(arguments);
var url=args[0];
url=url.replace(/(.*?)[?|#|&]{0,1}$/g,'$1');
args=args.slice(1);
$.each(args,function(){
var str=buildParam(this);
if(str){
url+=(url.indexOf('?')>=0?'&':'?')+str;
}
});
return url;
};
var mergeStaticUri=function(){
var args=util.toArray(arguments);
var url=args[0];
args=args.slice(1);
$.each(args,function(){
var str=buildParam(this);
if(str){
url+=/(\?|#|&)$/.test(url)?'':(/\?|#|&/.test(url)?'&':'#');
url+=str;
}
});
return url;
};
var _AJAX_CACHE_DATA_={};
var request=function(url,data,opt){
opt=$.extend({
method:'get',
format:'json',
async:true,
timeout:10000,
charset:'utf-8',
cache:false,
frontCache:false,
jsonpCallback:'_callback',
onSuccess:function(){},
onError:function(){msg.show("后台有点忙，请稍后重试",'err');}
},opt);
if(util.inArray(opt.format,['json','jsonp','formsender'])){
url=mergeCgiUri(url,{ref:opt.format});
}
var url_id=buildParam(url,data);
if(opt.frontCache){
if(_AJAX_CACHE_DATA_[url_id]!==undefined){
opt.onSuccess(_AJAX_CACHE_DATA_[url_id]);
return null;
}
}
return $.ajax(url,{
async:opt.async,
cache:opt.cache,
type:opt.method,
timeout:opt.timeout,
scriptCharset:opt.charset,
data:data,
dataType:opt.format,
jsonpCallback:opt.jsonpCallback,
success:function(rsp){
if(opt.frontCache){
_AJAX_CACHE_DATA_[url_id]=rsp;
}
opt.onSuccess(rsp);
},
error:function(){
opt.onError();
}
});
};
var get=function(url,data,onSuccess,opt){
opt=$.extend({
onSuccess:onSuccess
},opt||{});
request(url,data,opt);
};
var post=function(url,data,onSuccess,opt){
opt=$.extend({
method:'post',
onSuccess:onSuccess
},opt||{});
request(url,data,opt);
};
var getFormData=function(form){
form=$(form);
var data={};
var elements=form[0].elements;
$.each(elements,function(){
var name=this.name;
if(!data[name]){
data[name]=[];
}
if(this.type=='radio'){
if(this.checked){
data[name].push(this.value);
}
}else if($(this).attr('name')!==undefined&&$(this).attr('value')!==undefined){
data[name].push(this.value);
}
});
var data_str=[];
$.each(data,function(key,v){
$.each(v,function(k,val){
data_str.push(encodeURIComponent(key)+'='+encodeURIComponent(val));
})
});
return data_str.join('&');
};
return{
getParam:getParam,
setHash:setHash,
buildParam:buildParam,
mergeStaticUri:mergeStaticUri,
mergeCgiUri:mergeCgiUri,
request:request,
get:get,
post:post,
getFormData:getFormData
};
});
define('ywj/placeholder',function(require){
var $=require('jquery');
var bindFormSubmit=function(el){
var p=el.parentsUntil('form');
if(p){
var form=p.parent();
if(!form.data('placeholder-event-flag')){
form.data('placeholder-event-flag',1);
form.submit(function(){
$.each(form[0].elements,function(){
var $this=$(this);
var pl=$this.attr('placeholder');
if(pl&&pl==$this.val()){
$this.val('');
}
});
});
}
}
};
return function(el,normalClass,focusClass,emptyClass){
el=$(el);
if(el[0].type=='password'){
var self=el,
txt=self.attr('placeholder');
self.wrap($('<div></div>').css({position:'relative',zoom:'1',border:'none',background:'none',padding:'none',margin:'none'}));
var pos=self.position(),
h=self.outerHeight(true)+'px',
paddingLeft=self.css('padding-left');
var holder=$('<span></span>').text(txt).css({position:'absolute',left:pos.left,top:pos.top,height:h,lineHeight:h,paddingLeft:paddingLeft,color:'#999',fontSize:'14px'}).appendTo(self.parent());
self.focusin(function(e){
holder.hide();
}).focusout(function(e){
if(!self.val()){
holder.show();
}
});
holder.click(function(e){
holder.hide();
self.focus();
});
return;
}
normalClass=normalClass||'';
focusClass=focusClass||'';
emptyClass=emptyClass||'';
var phTxt=el.attr('placeholder');
if(!phTxt){
console.warn('need placeholder attr');
return;
}
el.on('focus',function(){
el.removeClass(emptyClass).removeClass(normalClass).addClass(focusClass);
if(el.val()==phTxt){
el.val('');
}
});
el.on('blur',function(){
el.removeClass(emptyClass).removeClass(normalClass).removeClass(focusClass);
if(el.val()==''||el.val()==phTxt){
el.val(phTxt);
el.addClass(emptyClass);
}else{
el.addClass(normalClass);
}
});
if(!el.val()){
el.removeClass(normalClass).removeClass(focusClass).addClass(emptyClass);
el.val(phTxt);
}
bindFormSubmit(el);
};
});
define('ywj/popup',function(require){
var $=require('jquery');
var util=require('ywj/util');
var masker=require('ywj/masker');
var POP_COLLECT_KEY='__POPUP_COLLECTION__';
var YWJ_WIDGET_POPUP='YWJ_WIDGET_POPUP';
var emptyFn=function(){};
$('<style type="text/css">'+[
'.PopupDialog {zoom:1; filter: progid:DXImageTransform.Microsoft.DropShadow(OffX=2, OffY=2, Color=#cccccc);}',
'.PopupDialog * {margin:0; padding:0}',
'.PopupDialog {position:absolute; top:20px; left:20px; width:350px; border:1px solid #999; border-top-color:#bbb; border-left-color:#bbb; background-color:white; box-shadow:0 0 8px #aaa; border-radius:3px}',
'.PopupDialog-hd {height:28px; background-color:#fff; cursor:move; position:relative; border-radius:3px 3px 0 0}',
'.PopupDialog-hd h3 {font-size:12px; font-weight:bolder; color:gray; padding-left:10px; line-height:28px;}',
'.PopupDialog-close {display:block; overflow:hidden; width:28px; height:28px; position:absolute; right:0; top:0; text-align:center; cursor:pointer; font-size:17px; font-family:Verdana; text-decoration:none; color:gray;}',
'.PopupDialog-close:hover {color:black;}',
'.PopupDialog-ft {background-color:#f3f3f3; white-space:nowrap; border-top:1px solid #e0e0e0; padding:5px 5px 5px 0; text-align:right; border-radius:0 0 3px 3px}',
'.PopupDialog-text {padding:20px;}',
'.PopupDialog-bd-frm {border:none; width:100%}',
'.PopupDialog-btn {display:inline-block; font-size:12px; cursor:pointer; box-shadow:1px 1px #fff; text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.7); background:-moz-linear-gradient(19% 75% 90deg, #E0E0E0, #FAFAFA); background:-webkit-gradient(linear, left top, left bottom, from(#FAFAFA), to(#E0E0E0)); color:#4A4A4A; background-color:white; text-decoration:none; padding:0 15px; height:20px; line-height:20px; text-align:center; border:1px solid #ccd4dc; white-space:nowrap; border-radius:2px}',
'.PopupDialog-btn:hover {background-color:#eee}',
'.PopupDialog-btnDefault {}'].join('')
+'</style>')
.appendTo($('head'))
.attr('id',YWJ_WIDGET_POPUP);
window[POP_COLLECT_KEY]={};
var Popup=function(config){
this.container=null;
this.status=0;
this._eventBinded=false;
this._events={};
this._eventParams={};
this._readyCbList=[];
this.guid=util.guid();
this.onShow=emptyFn;
this.onClose=emptyFn;
this.config=$.extend({},{
ID_PRE:'popup-dialog-id-pre',
title:'对话框',
content:'测试',
width:400,
moveEnable:true,
moveTriggerByContainer:false,
zIndex:1000,
isModal:false,
topCloseBtn:true,
showMask:true,
keepWhileHide:false,
cssClass:{
dialog:'PopupDialog',
head:'PopupDialog-hd',
body:'PopupDialog-bd',
textCon:'PopupDialog-text',
iframe:'PopupDialog-bd-frm',
container:'PopupDialog-dom-ctn',
foot:'PopupDialog-ft'
},
buttons:[
]
},config);
window[POP_COLLECT_KEY][this.guid]=this;
};
Popup.prototype.onReady=function(callback){
if(this._ready){
callback();
}else{
this._readyCbList.push(callback);
}
};
Popup.prototype._callReadyList=function(){
this._ready=true;
$.each(this._readyCbList,function(k,fn){
fn();
});
this._readyCbList=[];
};
Popup.prototype.show=function(){
var _this=this;
initStructure.call(this,function(){
_this.config.showMask&&masker.show();
_this.container.show();
var iframe=$('iframe',_this.container);
if(iframe.size()){
updateIframeHeight.call(_this,iframe[0]);
}
updateDialogRegion.call(_this);
if(!_this._eventBinded){
bindEvent.call(_this);
bindMoveEvent.call(_this);
bindEscCloseEvent.call(_this);
_this._eventBinded=true;
}
updateDialogZIndex.call(_this);
_this.onShow();
_this.status=1;
});
};
Popup.prototype.updateHeight=function(height){
var iframe=$('iframe',this.container);
if(iframe.size()){
updateIframeHeight.call(this,iframe[0],height);
}
};
Popup.prototype.focus=function(){
var a=$('A',this.container);
if(a[0]){
a.focus();
}
};
Popup.prototype.setEnable=function(){
var mask=$('.PopupDialog-Modal-Mask',this.container);
if(mask){
mask.hide();
}
};
Popup.prototype.setDisable=function(){
$('.PopupDialog-Modal-Mask',this.container).css({height:this.container.height(),opacity:0.4});
};
Popup.prototype.close=function(){
if(this.onClose()===false){
return;
}
this.container.hide();
this.status=0;
var _this=this,
hasDialogLeft=false,
hasModalPanelLeft=false;
if(!this.config.keepWhileHide){
var tmp={};
$.each(window[POP_COLLECT_KEY],function(guid){
if(guid!=_this.guid){
tmp[this.guid]=this;
}
});
window[POP_COLLECT_KEY]=tmp;
_this.container.remove();
_this.container=null;
}
$.each(window[POP_COLLECT_KEY],function(k,dialog){
if(dialog.status){
hasDialogLeft=true;
}
if(dialog.status&&dialog.config.isModal){
hasModalPanelLeft=true;
dialog.setEnable();
dialog.focus();
return false;
}
});
if(!hasDialogLeft){
masker.hide();
}
if(!hasModalPanelLeft){
var _lastTopPanel;
$.each(window[POP_COLLECT_KEY],function(k,dialog){
if(!dialog.status){
return;
}
dialog.setEnable();
if(!_lastTopPanel){
_lastTopPanel=dialog;
}else if(_lastTopPanel.config.zIndex<=dialog.config.zIndex){
_lastTopPanel=dialog;
}
});
if(_lastTopPanel){
_lastTopPanel.focus();
}
}
};
Popup.prototype.closeOther=function(){
try{
var _this=this;
$.each(window[POP_COLLECT_KEY],function(k,pop){
if(pop!=_this){
pop.close();
}
});
}catch(e){}
};
Popup.prototype.listen=function(key,handler){
if(this._eventParams[key]){
handler.apply(this,this._eventParams[key]);
}else{
if(this._events[key]){
this._events[key].push(handler);
}else{
this._events[key]=[handler];
}
}
};
Popup.prototype.fire=function(key){
var _this=this;
var args=util.toArray(arguments).slice(1);
this._eventParams[key]=args;
if(this._events[key]){
$.each(this._events[key],function(k,fn){
fn.apply(_this,args);
});
}
};
Popup.getPopupByGuid=function(guid){
var result;
$.each(window[POP_COLLECT_KEY],function(k,pop){
if(pop.guid==guid){
result=pop;
return false;
}
});
return result;
};
Popup.showConfirm=function(title,content,onConfirm,onCancel,config){
var pop;
var on_confirm=function(){
if(onConfirm){
onConfirm();
}
pop.close();
};
var on_cancel=function(){
if(onCancel){
onCancel();
}
pop.close();
};
var conf=$.extend({},{
title:title||'确认',
content:content,
width:350,
topCloseBtn:false,
isModal:true,
buttons:[
{name:'确定',handler:on_confirm,setDefault:true},
{name:'取消',handler:on_cancel}
]
},config);
pop=new Popup(conf);
pop.show();
return pop;
};
Popup.showAlert=function(title,content,onSubmit,config){
var pop;
var on_submit=function(){
if(onSubmit){
onSubmit();
}
pop.close();
};
var conf=$.extend({
title:title||'提示',
content:content,
width:350,
topCloseBtn:false,
isModal:true,
buttons:[
{name:'确定',handler:on_submit,setDefault:true}
]
},config);
pop=new Popup(conf);
pop.show();
return pop;
};
var in_sub_win=false;
try{
in_sub_win=!!window.frameElement;
}catch(e){}
if(in_sub_win){
Popup.fire=function(key,p1,p2){
var pop=Popup.getCurrentPopup();
if(pop){
pop.fire.apply(pop,arguments);
}
};
Popup.listen=function(key,callback){
var pop=Popup.getCurrentPopup();
if(pop){
return pop.listen(key,callback);
}
return false;
};
Popup.closeAll=function(){
$.each(window[POP_COLLECT_KEY],function(k,pop){
pop.close();
});
};
Popup.resizeCurrentPopup=function(){
$(window).on('load',function(){
var wr=util.getRegion();
document.body.style.overflow='hidden';
window.frameElement.style.height=wr.documentHeight+'px';
});
};
Popup.getCurrentPopup=function(){
var guid=window.frameElement.getAttribute('guid');
if(guid){
return parent[POP_COLLECT_KEY][guid];
}
return null;
};
Popup.closeCurrentPopup=function(){
var curPop=this.getCurrentPopup();
if(curPop){
curPop.close();
}
};
}
var initStructure=function(onload){
onload=onload||emptyFn;
if(this.container){
onload();
return;
}
var id=this.config.ID_PRE+util.guid();
this.container=$('<div class="'+this.config.cssClass.dialog+'" style="left:-9999px" id="'+id+'"></div>').appendTo($('body'));
var content='<div class="'+this.config.cssClass.body+'">';
if(typeof(this.config.content)=='string'){
content+='<p class="'+this.config.cssClass.textCon+'">'+this.config.content+'</p>';
}else if(this.config.content.src){
content+='<iframe allowtransparency="true" guid="'+this.guid+'" src="'+this.config.content.src+'" class="'+this.config.cssClass.iframe+'" frameborder=0></iframe>';
}else if(this.config.content.id){
content+=$(this.config.content.id).html();
}else{
content+='<div class="'+this.config.cssClass.container+'"></div>';
}
content+='</div>';
var btn_html='';
if(this.config.buttons.length>0){
btn_html='<div class="'+this.config.cssClass.foot+'">';
for(var i=0;i<this.config.buttons.length;i++){
btn_html+='&nbsp;<a href="javascript:;" class="PopupDialog-btn'+(this.config.buttons[i].setDefault?' PopupDialog-btnDefault':'')+'">'+this.config.buttons[i].name+'</a>';
}
btn_html+='</div>';
}
var html=([
'<div class="PopupDialog-wrap">',
'<div class="PopupDialog-Modal-Mask" style="position:absolute; height:0; overflow:hidden; z-index:2; background-color:#ccc; width:100%"></div>',
'<div class="',this.config.cssClass.head+'">',
'<h3>',this.config.title,'</h3>',
(this.config.topCloseBtn?'<span class="PopupDialog-close" tabindex="0" title="关闭窗口">x</span>':''),
'</div>',content,btn_html,
'</div>'
]).join('');
this.container.html(html);
if(this.config.content.src){
$('iframe',this.container).on('load',onload);
}else{
onload();
}
};
var updateIframeHeight=function(iframe,height){
try{
var w=iframe.contentWindow;
var d=w.document;
var b=w.document.body;
w.focus();
}catch(ex){
console.log(ex);
return false;
}
height=height||this.config.height;
if(!height&&b){
b.style.overflow='hidden';
if(!b.style.width){
b.style.width=this.config.width+'px';
}
var h1=w.innerHeight||((d.documentElement&&d.documentElement.clientHeight)?d.documentElement:d.body).clientHeight;
var tag=(d.documentElement&&d.documentElement.scrollHeight)?d.documentElement:d.body;
var h2=tag.scrollHeight;
$(iframe).css('height',Math.max(h1,h2));
}else{
$(iframe).css('height',height);
}
};
var getParentScrollInfo=function(){
var region={
top:0,
left:0
};
try{
if(window.frameElement){
region.top=parent.document.documentElement.scrollTop||parent.pageYOffset||parent.document.body.scrollTop;
region.left=$('body',parent.document).scrollLeft();
}
}catch(ex){
console.log(ex);
}
return region;
};
var getParentWinRegion=function(){
var region={
visibleHeight:9999999,
visibleWidth:9999999
};
try{
if(window.frameElement){
var pr=util.getRegion(parent);
region.visibleHeight=pr.visibleHeight;
region.visibleWidth=pr.visibleWidth;
}
}catch(ex){
console.log(ex);
}
return region;
};
var updateDialogRegion=function(){
var $body=$('body');
var region=$.extend({
height:this.container.height(),
width:this.container.width()
},this.config);
region.minHeight=region.minHeight||78;
var scroll={
top:document.documentElement.scrollTop||window.pageYOffset||document.body.scrollTop,
left:$body.scrollLeft()
},
parentScroll=getParentScrollInfo(),
winRegion=util.getRegion(),
parentRegion=getParentWinRegion(),
top=0,
left=0;
scroll.top+=parentScroll.top;
scroll.left+=parentScroll.left;
winRegion.visibleHeight=Math.min(winRegion.visibleHeight,parentRegion.visibleHeight);
winRegion.visibleWidth=Math.min(winRegion.visibleWidth,parentRegion.visibleWidth);
if(winRegion.visibleHeight>region.height){
top=scroll.top+(winRegion.visibleHeight-region.height)/4;
}else if(winRegion.documentHeight>region.height){
top=scroll.top;
}
if(winRegion.visibleWidth>region.width){
left=winRegion.visibleWidth/2-region.width/2-scroll.left;
}else if(winRegion.documentWidth>region.width){
left=scroll.left;
}
var calStyle={left:left,top:top,zIndex:this.config.zIndex};
if(this.config.top!==undefined){
calStyle.top=this.config.top;
}
if(this.config.left!==undefined){
calStyle.left=this.config.left;
}
this.container.css(calStyle);
if(this.config.height){
$('.'+this.config.cssClass.body,this.container).css('height',this.config.height);
}
if(this.config.width){
this.container.css('width',this.config.width);
}
};
var updateDialogZIndex=function(){
var hasOtherModalPanel=false;
var _this=this;
$.each(window[POP_COLLECT_KEY],function(guid){
if(this!=_this&&this.status&&this.config.isModal){
_this.config.zIndex=this.config.zIndex-1;
hasOtherModalPanel=true;
return false;
}else if(_this!=this&&this.status&&!this.config.isModal){
if(this.config.zIndex>_this.config.zIndex){
_this.config.zIndex=this.config.zIndex+1;
}else if(this.config.zIndex==_this.config.zIndex){
_this.config.zIndex+=1;
}
}
});
_this.container.css('zIndex',_this.config.zIndex);
if(hasOtherModalPanel){
_this.setDisable();
}else if(_this.config.isModal){
$.each(window[POP_COLLECT_KEY],function(guid){
if(this!=_this&&this.status){
this.setDisable();
}
});
_this.focus();
}else{
_this.focus();
}
};
var bindEvent=function(){
var _this=this;
$('.PopupDialog-close',this.container).on('click',function(){
_this.close();
});
$('a.PopupDialog-btn',this.container).each(function(i){
$(this).click(function(){
var hd=_this.config.buttons[i].handler||function(){_this.close();};
if(typeof(hd)=='string'){
_this.fire(hd,function(fn){fn();});
}else{
hd.apply(this,arguments);
}
});
});
$('a.PopupDialog-btnDefault',this.container).focus();
this.container.on('mousedown',function(){
updateZIndex.call(_this);
});
};
var updateZIndex=function(){
var _this=this;
var hasModalPanel=false;
$.each(window[POP_COLLECT_KEY],function(k,dialog){
if(dialog!=_this&&dialog.status&&dialog.config.isModal){
hasModalPanel=true;
return false;
}else if(dialog!=_this&&dialog.status){
if(dialog.config.zIndex>=_this.config.zIndex){
_this.config.zIndex=dialog.config.zIndex+1;
}
}
});
if(hasModalPanel){
return;
}
this.container.css('zIndex',this.config.zIndex);
};
var bindMoveEvent=function(){
if(!this.config.moveEnable){
return;
}
var _this=this;
var _lastPoint={X:0,Y:0};
var _lastRegion={top:0,left:0};
var _moving;
var letie8=$.browser.msie&&parseInt($.browser.version,10)<=8;
$(document).on('mousemove',function(event){
if(!_this.container||!_moving||(event.button!==0&&!letie8)){
return false;
}
var offsetX=parseInt(event.clientX-_lastPoint.X,10);
var offsetY=parseInt(event.clientY-_lastPoint.Y,10);
var newLeft=Math.max(_lastRegion.left+offsetX,0);
var newTop=Math.max(_lastRegion.top+offsetY,0);
_this.container.css({top:newTop,left:newLeft});
});
$('body').on('mousedown',function(event){
if(!_this.container||(event.button!==0&&!letie8)){
return;
}
var head=_this.config.moveTriggerByContainer?_this.container:$('.'+_this.config.cssClass.head,_this.container);
var tag=event.target;
if($.contains(head[0],tag)){
_moving=true;
_lastRegion={
left:parseInt(_this.container.css('left'),10),
top:parseInt(_this.container.css('top'),10)
};
_lastPoint={X:event.clientX,Y:event.clientY};
return false;
}
});
$(document).on('mouseup',function(){
_moving=false;
});
};
var ESC_BINDED;
var bindEscCloseEvent=function(){
if(ESC_BINDED){
return;
}
ESC_BINDED=true;
$(document).on('keyup',function(event){
if(event.keyCode==27){
var lastDialog=null;
$.each(window[POP_COLLECT_KEY],function(k,dialog){
if(dialog.config.isModal&&dialog.status&&dialog.config.topCloseBtn){
lastDialog=dialog;
return false;
}else if(dialog.status&&dialog.config.topCloseBtn){
if(!lastDialog||lastDialog.config.zIndex<=dialog.config.zIndex){
lastDialog=dialog;
}
}
});
if(lastDialog){
lastDialog.close();
}
}
});
};
return Popup;
});
define('ywj/selectui',function(require){
var $=require('jquery');
return function(sel,opt){
opt=$.extend({
cssClass:'g-select',
hoverClass:'g-select-hover',
childHover:'hover',
childActive:'active'
},opt);
$(sel).each(function(){
var select=this;
var current=this.options[this.selectedIndex];
var w=$(this).outerWidth();
var h=$(this).outerHeight();
var html='<dl class="'+opt.cssClass+'" style="width:'+w+'px; height:'+h+'px">';
html+='<dt tabindex=0>'+$(current).text()+'</dt>';
$.each(this.options,function(k,option){
html+='<dd tabindex=0 class="'+(k==select.selectedIndex?opt.childActive:'')+'">'+decodeURI($(option).text())+'</dd>';
});
html+='</dl>';
var n=$(html).insertAfter(this);
$(this).hide();
n.hover(function(){
$(this).addClass(opt.hoverClass);
},function(){
$(this).removeClass(opt.hoverClass);
});
n.children().hover(function(){
$(this).addClass(opt.childHover);
},function(){
$(this).removeClass(opt.childHover);
});
$('dd',n).click(function(){
var idx=$(this).index()-1;
n.children().removeClass(opt.childActive);
$(this).addClass(opt.childActive);
$('dt',n).html($(this).text());
n.removeClass(opt.hoverClass);
select.selectedIndex=idx;
$(select).trigger('change');
});
})
};
});
define('ywj/slide',function(require){
var PRIVATE_VARS={};
var util=require('ywj/util');
var bindEvent=function(slide,content){
var hovering=false;
var hover_check_time=50;
$(content).mouseover(function(){
hovering=true;
slide.pause();
});
$(content).mouseout(function(){
hovering=false;
setTimeout(function(){
if(!hovering){
slide.resume();
}
},hover_check_time);
});
};
var Slide=function(content,option){
var guid=util.guid();
PRIVATE_VARS[guid]={};
PRIVATE_VARS[guid].content_list=$(content).children();
this.guid=guid;
this.index=0;
this.option=$.extend({
interval:3000
},option);
bindEvent(this,content);
};
Slide.prototype.addControl=function($control,event){
var s=this;
event=event||'mouseover';
$($control).children().each(function(k,v){
$(this)[event](function(){
s.switchTo(k);
s.pause();
return false;
});
});
};
Slide.prototype.animate=function(fromCon,toCon,callback){
fromCon.animate({opacity:0},100,null,function(){fromCon.hide();});
toCon.show().animate({opacity:0},0).animate({opacity:1},100);
callback();
};
Slide.prototype.onSwitchTo=function(fromNode,toNode){};
Slide.prototype.switchTo=function(idx,callback){
callback=callback||function(){};
if(idx==this.index){
callback();
return;
}
var from=PRIVATE_VARS[this.guid].content_list.eq(this.index);
var to=PRIVATE_VARS[this.guid].content_list.eq(idx);
this.animate(from,to,callback);
this.onSwitchTo(from,to);
this.index=idx;
};
Slide.prototype.switchToNext=function(){
var total=PRIVATE_VARS[this.guid].content_list.size();
var idx=(this.index==total-1)?0:(this.index+1);
this.switchTo(idx);
};
Slide.prototype.switchToPre=function(){
var total=PRIVATE_VARS[this.guid].content_list.size();
var idx=(this.index==0)?(total-1):(this.index-1);
this.switchTo(idx);
};
Slide.prototype.start=function(idx){
idx=idx!==undefined?idx:this.index;
this.stop();
PRIVATE_VARS[this.guid].stop=false;
this.run(idx);
};
Slide.prototype.pause=function(){
clearTimeout(PRIVATE_VARS[this.guid].timer);
PRIVATE_VARS[this.guid].stop=true;
};
Slide.prototype.resume=function(){
if(!PRIVATE_VARS[this.guid].stop){
return;
}
PRIVATE_VARS[this.guid].stop=false;
this.run(this.index);
};
Slide.prototype.stop=function(){
this.index=0;
clearTimeout(PRIVATE_VARS[this.guid].timer);
PRIVATE_VARS[this.guid].stop=true;
};
Slide.prototype.run=function(from){
if(PRIVATE_VARS[this.guid].stop){
return;
}
var _this=this,guid=this.guid;
var total=PRIVATE_VARS[guid].content_list.size();
var to=from==(total-1)?0:(from+1);
PRIVATE_VARS[this.guid].timer=setTimeout(function(){
var fromNode=PRIVATE_VARS[guid].content_list.eq(from);
var toNode=PRIVATE_VARS[guid].content_list.eq(to);
_this.animate(fromNode,toNode,function(){
_this.onSwitchTo(fromNode,toNode);
_this.run(to);
_this.index=to;
});
},this.option.interval);
};
return Slide;
});
define('ywj/tabswitcher',function(require){
return function(tb,ctn,event,active_class,disable_class){
event=event||'click';
active_class=active_class||'active';
disable_class=disable_class||'disactive';
var tbs=$(tb).children();
var ctns=$(ctn).children();
tbs.each(function(idx){
$(this).on(event,function(ev){
tbs.each(function(i){
$(this)[i!=idx?'removeClass':'addClass'](active_class);
$(this)[i!=idx?'addClass':'removeClass'](disable_class);
});
ctns.each(function(i){
$(this)[i!=idx?'removeClass':'addClass'](active_class);
$(this)[i!=idx?'addClass':'removeClass'](disable_class);
});
if($('input[type=radio]',this).size()){
$('input[type=radio]',this).attr('checked',true);
}
if(event=='click'&&ev.target.type!='radio'){
return false;
}
});
});
};
});
define('ywj/timepicker',function(require){
require('jquery/ui/timepicker');
var css=".ui-timepicker-div .ui-widget-header { margin-bottom: 8px; }\
    .ui-timepicker-div dl { text-align: left; }\
    .ui-timepicker-div dl dt { float: left; clear:left; padding: 0 0 0 5px; }\
    .ui-timepicker-div dl dd { margin: 0 10px 10px 45%; }\
    .ui-timepicker-div td { font-size: 90%; }\
    .ui-tpicker-grid-label { background: none; border: none; margin: 0; padding: 0; }\
    .ui-timepicker-rtl{ direction: rtl; }\
    .ui-timepicker-rtl dl { text-align: right; padding: 0 5px 0 0; }\
    .ui-timepicker-rtl dl dt{ float: right; clear: right; }\
    .ui-timepicker-rtl dl dd { margin: 0 45% 10px 10px; }";
$(function(){
$('<style type="text/css">'+css+'</style>').appendTo($('head'));
});
});
define('ywj/tip',function(require){
require('ywj/resource/tip.css');
var util=require('ywj/util');
var PRIVATE_VARS={};
var bindEvent=function(){
if(PRIVATE_VARS[this.guid].opt.closeBtn){
var btn=$('.ywj-tip-close',PRIVATE_VARS[this.guid].container);
var _this=this;
btn.click(function(){
_this.hide();
});
}
};
var updatePosition=function(px,py){
var vars=PRIVATE_VARS[this.guid];
var width=vars.container.outerWidth();
var height=vars.container.outerHeight();
var offset={
11:[-width*0.25,0],
0:[-width*0.5,0],
1:[-width*0.75,0],
2:[-width,-height*0.25],
3:[-width,-height*0.5],
4:[-width,-height*0.75],
5:[-width*0.75,-height],
6:[-width*0.5,-height],
7:[-width*0.25,-height],
8:[0,-height*0.75],
9:[0,-height*0.5],
10:[0,-height*0.25]
};
var x=px+offset[vars.opt.dir][0];
var y=py+offset[vars.opt.dir][1];
vars.container.css({
left:parseInt(x,10),
top:parseInt(y,10)
});
};
var Tip=function(content,opt){
this.guid=util.guid();
PRIVATE_VARS[this.guid]={};
opt=$.extend({
closeBtn:true,
expired:0,
dir:0,
width:250,
relTag:null,
posX:0,
posY:0
},opt);
opt.relTag=$(opt.relTag);
var html='<div class="ywj-tip-container-wrap ywj-tip-'+opt.dir+'" style="display:none; width:'+opt.width+'px;">'+
'<s class="ywj-tip-arrow ywj-tip-arrow-pt"></s>'+
'<s class="ywj-tip-arrow ywj-tip-arrow-bg"></s>'+
(opt.closeBtn?'<span class="ywj-tip-close">X</span>':'')+
'<div class="ywj-tip-content">'+
content+
'</div>'+
'</div>';
PRIVATE_VARS[this.guid].opt=opt;
PRIVATE_VARS[this.guid].container=$(html).appendTo($('body'));
bindEvent.call(this);
};
Tip.prototype.show=function(){
var vars=PRIVATE_VARS[this.guid];
vars.container.show();
var x=vars.posX;
var y=vars.posY;
if(vars.opt.relTag){
var pos=vars.opt.relTag.offset();
var size={width:vars.opt.relTag.width(),height:vars.opt.relTag.height()};
var offset={
11:[size.width/2,size.height],
0:[size.width/2,size.height],
1:[size.width/2,size.height],
2:[0,size.height/2],
3:[0,size.height/2],
4:[0,size.height/2],
5:[size.width/2,0],
6:[size.width/2,0],
7:[size.width/2,0],
8:[size.width,size.height/2],
9:[size.width,size.height/2],
10:[size.width,size.height/2]
};
x=pos.left+offset[vars.opt.dir][0];
y=pos.top+offset[vars.opt.dir][1];
}
updatePosition.call(this,x,y);
if(vars.opt.expired){
var _this=this;
setTimeout(function(){
_this.hide();
},vars.opt.expired*1000);
}
};
Tip.prototype.hide=function(){
PRIVATE_VARS[this.guid].container.hide();
};
Tip.prototype.destroy=function(){
PRIVATE_VARS[this.guid].container.remove();
};
Tip.show=function(content,relTag,opt){
opt=opt||{};
opt.relTag=relTag;
var tip=new Tip(content,opt);
tip.show();
return tip;
};
return Tip;
});
define('ywj/util',function(require){
var $=require('jquery');
var inArray=function(item,arr){
for(var i=arr.length-1;i>=0;i--){
if(arr[i]==item){
return true;
}
}
return false;
};
var isEmptyObject=function(obj){
if(typeof(obj)=='object'){
for(var i in obj){
if(i!==undefined){
return false;
}
}
}
return true;
};
var isPlainObject=function(obj){
return obj&&toString.call(obj)==="[object Object]"&&!obj["nodeType"]&&!obj["setInterval"];
};
var isScalar=function(value){
var type=getType(value);
return type=='number'||type=='boolean'||type=='string'||type=='null'||type=='undefined';
};
var isBomOrDom=function(value){
if(this.isScalar(value)){
return false;
}
if($.browser.ie){
return value['nodeType']||value['srcElement']||(value['top']&&value['top']==Y.W.top);
}else{
return getType(value)!='object'&&getType(value)!='function';
}
};
var isBoolean=function(obj){
return getType(obj)=='boolean';
};
var isString=function(obj){
return getType(obj)=='string';
};
var isArray=function(obj){
return getType(obj)=='array';
};
var isFunction=function(obj){
return getType(obj)=='function';
};
var getType=function(obj){
return obj===null?'null':(obj===undefined?'undefined':Object.prototype.toString.call(obj).slice(8,-1).toLowerCase());
};
var findParent=function(node,con){
var ps=$(node).parentsUntil(con);
var tp=$(ps[ps.size()-1]);
return tp.parent();
};
var toArray=function(col){
if(col.item){
var l=col.length,arr=new Array(l);
while(l--)arr[l]=col[l];
return arr;
}else{
var arr=[];
for(var i=0;i<col.length;i++){
arr[i]=col[i];
}
return arr;
}
};
var accessObject=function(statement,obj){
obj=obj||{};
var tmp;
try{
eval('tmp = obj.'+statement);
}catch(ex){}
return tmp;
};
var getRegion=function(win){
var info={};
win=win||window;
var doc=win.document;
info.screenLeft=win.screenLeft?win.screenLeft:win.screenX;
info.screenTop=win.screenTop?win.screenTop:win.screenY;
if(win.innerWidth){
info.visibleWidth=win.innerWidth;
info.visibleHeight=win.innerHeight;
info.horizenScroll=win.pageXOffset;
info.verticalScroll=win.pageYOffset;
}else{
var tmp=(doc.documentElement&&doc.documentElement.clientWidth)?
doc.documentElement:doc.body;
info.visibleWidth=tmp.clientWidth;
info.visibleHeight=tmp.clientHeight;
info.horizenScroll=tmp.scrollLeft;
info.verticalScroll=tmp.scrollTop;
}
var tag=(doc.documentElement&&doc.documentElement.scrollWidth)?
doc.documentElement:doc.body;
info.documentWidth=Math.max(tag.scrollWidth,info.visibleWidth);
info.documentHeight=Math.max(tag.scrollHeight,info.visibleHeight);
return info;
};
var getFormData=function(formContainer){
var data=[];
$(':input',formContainer).each(function(){
if(!this.name||this.value===undefined){
return;
}
if((this.type=='radio'||this.type=='checkbox')){
if(this.checked){
data.push(encodeURIComponent(this.name)+'='+encodeURIComponent(this.value));
}
}else{
data.push(encodeURIComponent(this.name)+'='+encodeURIComponent(this.value));
}
});
return data.join('&');
};
var getU8StrLen=function(str){
var realLength=0;
var len=str.length;
var charCode=-1;
for(var i=0;i<len;i++){
charCode=str.charCodeAt(i);
if(charCode>=0&&charCode<=128){
realLength+=1;
}else{
realLength+=3;
}
}
return realLength;
};
var setNodeSelectDisabled=function(node){
if($.browser.mozilla){
$(node).css('MozUserSelect','none');
}else if($.browser.msie){
$(node).bind('selectstart',function(){return false;});
}else{
$(node).mousedown(function(){return false;});
}
};
var __guid=0;
var guid=function(){
return'_ywj_guid_'+(++__guid);
};
return{
getRegion:getRegion,
toArray:toArray,
inArray:inArray,
isArray:isArray,
getType:getType,
setNodeSelectDisabled:setNodeSelectDisabled,
isEmptyObject:isEmptyObject,
isPlainObject:isPlainObject,
isFunction:isFunction,
isScalar:isScalar,
isBomOrDom:isBomOrDom,
isBoolean:isBoolean,
isString:isString,
accessObject:accessObject,
getU8StrLen:getU8StrLen,
guid:guid,
findParent:findParent,
getFormData:getFormData
};
});
define('ywj/validator',function(require){
var $=require('jquery');
var util=require('ywj/util');
var REGEXP_COLLECTION={
REQUIRE:/^.+$/,
CHINESE_ID:/^\d{14}(\d{1}|\d{4}|(\d{3}[xX]))$/,
PHONE:/^[0-9]{7,13}$/,
EMAIL:/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/,
POSTCODE:/^[0-9]{6}$/,
AREACODE:/^0[1-2][0-9]$|^0[1-9][0-9]{2}$/,
CT_PASSPORT:/^[0-9a-zA-Z]{5,40}$/,
CT_MOBILE:/^(13|15|18)[0-9]{9}$/,
QQ:/^\d{5,13}$/,
TRIM:/^\s+|\s+$/g
};
var isEmptyObject=function(obj){
for(var i in obj){
return false;
}
return true;
};
var checkRadioChecked=function(element){
var elements=this.form[0].elements;
var name=element.name;
for(var i=0;i<elements.length;i++){
if(elements[i].name==name&&!!elements[i].checked){
return true;
}
}
return false;
};
var elementCheckAble=function(element){
return element.tagName!='FIELDSET'&&
element.type!='hidden'&&
element.type!='submit'&&
element.type!='button'&&
element.type!='reset'&&
element.type!='image';
};
var Va=function(form,rules,config){
this.form=$(form);
this.rules=rules;
this.config=$.extend({
breakOnError:false,
passClass:'validate-pass',
failClass:'validate-fail',
tipClass:'validate-tip'
},config);
};
Va.prototype.attach=function(){
var _this=this;
this.form.on('submit',function(){
var err=_this.checkAll();
if(err){
return false;
}
});
};
Va.prototype.checkItem=function(element,rules){
if(!rules){
return null;
}
var elements=this.form[0].elements;
var errors=[];
var uKey,len,ret;
var breakOnError=this.config.breakOnError;
if(element.tagName=='SELECT'||
(element.tagName=='INPUT'&&(element.type=='text'||element.type=='password'))){
var val=element.value.replace(REGEXP_COLLECTION.TRIM,'');
for(var key in rules){
uKey=key.toUpperCase();
if(typeof(rules[key])=='function'){
ret=rules[key](val,element);
if(ret){
if(!breakOnError){
return[ret];
}else{
errors.push(ret);
}
}
}
else if(REGEXP_COLLECTION[uKey]){
if(!REGEXP_COLLECTION[uKey].test(val)){
if(!breakOnError){
return[rules[key]];
}else{
errors.push(rules[key]);
}
}
}
else if(uKey.indexOf('MAX')===0){
len=parseInt(uKey.substr(3),10);
if(len>0&&len<val.length){
if(!breakOnError){
return[rules[key]];
}else{
errors.push(rules[key]);
}
}
}
else if(uKey.indexOf('MIN')===0){
len=parseInt(uKey.substr(3),10);
if(len>0&&len>val.length){
if(!breakOnError){
return[rules[key]];
}else{
errors.push(rules[key]);
}
}
}
else if(uKey.indexOf('/')===0){
var reg=new RegExp(key);
if(!reg.test(val)){
if(!breakOnError){
return[rules[key]];
}else{
errors.push(rules[key]);
}
}
}
}
}
else if(element.type=='checkbox'){
for(key in rules){
uKey=key.toUpperCase();
if(uKey=='REQUIRE'){
if(!element.checked){
if(typeof(rules[key])=='function'){
ret=rules[key](element.checked,element);
return[ret];
}else{
return[rules[key]];
}
}else{
return null;
}
}
}
}
else if(element.type=='radio'){
for(var key in rules){
uKey=key.toUpperCase();
if(uKey=='REQUIRE'){
if(!checkRadioChecked.call(this,element)){
return[rules[key]];
}else{
return null;
}
}
}
}
return errors;
};
Va.prototype.onBeforeCheck=function(){
};
Va.prototype.checkAll=function(){
this.onBeforeCheck();
this.resetError();
var errors={};
var error_flag=false;
var _this=this;
var elements=this.form[0].elements;
$.each(elements,function(){
if(elementCheckAble(this)){
var name=this.name;
if(this.type=='radio'&&errors[this.name]||!_this.rules[name]){
return;
}
var errs=_this.checkItem(this,_this.rules[name]);
_this.onItemChecked(this,errs);
if(!isEmptyObject(errs)){
errors[name]=errs;
error_flag=true;
if(_this.config.breakOnError){
return false;
}
}
}
});
return error_flag?errors:null;
};
Va.prototype.onItemChecked=function(element,errors){
if(!isEmptyObject(errors)){
return this.onItemCheckFail(element,errors);
}else{
return this.onItemCheckPass(element);
}
};
Va.prototype.setItemMessage=function(element,errors){
var pass=isEmptyObject(errors);
$(element)[pass?'addClass':'removeClass'](this.config.passClass)[pass?'removeClass':'addClass'](this.config.failClass);
var pn=$(element.parentNode);
var tip=$('span.'+this.config.tipClass,pn);
if(!tip.size()){
tip=$('<span class="'+this.config.tipClass+'"></span>').appendTo(pn);
}
$(tip)[pass?'addClass':'removeClass'](this.config.passClass)[pass?'removeClass':'addClass'](this.config.failClass).html(errors[0]);
};
Va.prototype.onItemCheckPass=function(element){
this.setItemMessage(element,[]);
};
Va.prototype.onItemCheckFail=function(element,errors){
this.setItemMessage(element,errors);
};
Va.prototype.resetError=function(element){
$('span.'+this.config.tipClass,this.form).removeClass(this.config.passClass).removeClass(this.config.failClass).html('');
};
Va.REGS=REGEXP_COLLECTION;
return Va;
});
define('ywj/tooltip',function(require){
require('jquery/ui/tooltip');
var msg_css_url=seajs.resolve('ywj/resource/tooltip.css');
var top_doc;
try{
top_doc=parent.document;
}catch(ex){}
top_doc=top_doc||document;
$('head',top_doc).append('<link rel="stylesheet" type="text/css" href="'+msg_css_url+'"/>');
});
define('ywj/imgslide',function(require){
var imgslide_css_url=seajs.resolve('ywj/resource/imgslide.css');
var tmpl=require('ywj/tmpl');
var top_doc;
try{
top_doc=parent.document;
}catch(ex){}
top_doc=top_doc||document;
$('head',top_doc).append('<link rel="stylesheet" type="text/css" href="'+imgslide_css_url+'"/>');
var IMG_SLIDE_TPL='<div class="ui-img-slide">'+
'<div class="g-slide" data-hover="1" id="g-slide">'+
'<ul class="g-slide-list"><li><span class="g-slide-img"><img src="<%=slide.current_img.src%>" alt="<%=slide.current_img.title%>" class="bigImg"></span></li></ul>'+
'<div class="g-slide-tp">'+
'<a class="g-slide-prev" href="javascript:void(0);"><span>上一张</span></a>'+
'<a class="g-slide-next" href="javascript:void(0);"><span>下一张</span></a>'+
'</div>'+
'</div>'+
'<p class="g-pic-intro"><%=slide.title%></p>'+
'<div class="image-viewer-selector">'+
'<a href="javascript:void(0);" class="slide-left-btn"><span>scroll left</span></a>'+
'<a href="javascript:void(0);" class="slide-right-btn"><span>scroll right</span></a>'+
'<div class="image-view-selector-content-wrap">'+
'<ul class="image-viewer-selector-list" style="width: 5160px; margin-left: 0;">'+
'<% for (var k=0; k<slide.img_list.length; k++){ var img = slide.img_list[k];%>'+
'<li data-img_id="<%=k%>" class="uiSliderImg"><i></i>'+
'<a href="javascript:void(0);" title="<%=img.title%>"><img src="<%=img.src%>" data-big_img="<%=img.big_img%>" alt="<%=img.title%>" onload="__img_adjust__(this)" data-min-width="85" data-min-height="85"></a>'+
'</li>'+
'<%}%>'+
'</ul>'+
'</div>'+
'</div>'+
'<a href="javascript:void(0);" title="点击关闭" class="scan-close"></a>'+
'</div>'+
'<div class="ui-img-layer"></div>';
var IMG_SLIDE_DATA={
current_img:{
index:0,
title:'',
src:''
},
img_list:[],
title:'',
group_id:'0_0'
};
var IMG_SLIDE=function(){
};
IMG_SLIDE.prototype={
config:{
img_tag:"img[rel=slide-img]",
img_parent_tag:"*[rel=img-slide]"
},
_TPL_OBJ:null,
_initData:function($img){
var cfg=this.config;
var $slideContainer=$img.parents(cfg.img_parent_tag);
IMG_SLIDE_DATA.title=$slideContainer.attr("title")||'';
IMG_SLIDE_DATA.group_id=$slideContainer.attr("slide-group");
IMG_SLIDE_DATA.img_list=[];
$slideContainer.find(cfg.img_tag).each(function(index){
var self=$(this);
if(self.data('img_id')==$img.data('img_id')){
IMG_SLIDE_DATA.current_img={
index:index,
title:self.attr('title')||'',
src:self.data('big_img')||''
};
}
IMG_SLIDE_DATA.img_list.push({
src:self.attr('src'),
title:self.attr('title')||'',
big_img:self.data('big_img')||''
});
});
},
_initSlideGroup:function(){
var cfg=this.config;
var group=[];
$(cfg.img_parent_tag).each(function(){
var _this=$(this);
var slideGroup=_this.attr('slide-group');
if(!slideGroup){
group[0]=isNaN(group[0])?0:++group[0];
_this.attr('slide-group',0+'_'+group[0]);
}else{
group[slideGroup]=isNaN(group[slideGroup])?0:++group[slideGroup];
_this.attr('slide-group',slideGroup+'_'+group[slideGroup]);
}
_this.find(cfg.img_tag).each(function(index){
$(this).data('img_id',index);
});
});
},
_formatHtml:function(){
this._TPL_OBJ=$(tmpl(IMG_SLIDE_TPL,{slide:IMG_SLIDE_DATA}));
},
_nextGroup:function(){
var cfg=this.config;
var that=this;
var cg=IMG_SLIDE_DATA.group_id;
var cg_arr=cg.split('_');
var ng=cg_arr[0]+'_'+(parseInt(cg_arr[1])+1);
var $nextGroup=$('*[slide-group='+ng+']');
if($nextGroup.length<=0){
return false;
}
var $img=$nextGroup.find(cfg.img_tag).first();
that.close();
$img.click();
},
_preGroup:function(){
var cfg=this.config;
var that=this;
var cg=IMG_SLIDE_DATA.group_id;
var cg_arr=cg.split('_');
var ng=cg_arr[0]+'_'+(parseInt(cg_arr[1])-1);
var $nextGroup=$('*[slide-group='+ng+']');
if($nextGroup.length<=0){
return false;
}
var $img=$nextGroup.find(cfg.img_tag).last();
that.close();
$img.click();
},
init:function(){
var cfg=this.config;
var that=this;
that._initSlideGroup();
$('body').delegate(cfg.img_tag,'click',function(){
that._initData($(this));
that._formatHtml();
that.show();
});
},
handleEvent:function(){
var that=this;
var PER_WIDTH=86;
var $CLOSE_BTN=this._TPL_OBJ.find(".scan-close");
var $SLIDE_IMG=this._TPL_OBJ.find(".uiSliderImg");
var $SELECTOR=this._TPL_OBJ.find('.image-viewer-selector-list');
var $SELECTOR_WRAP=this._TPL_OBJ.find('.image-view-selector-content-wrap');
var $SLIDE_NEXT=this._TPL_OBJ.find('.slide-right-btn,.g-slide-next');
var $SLIDE_PREV=this._TPL_OBJ.find('.slide-left-btn,.g-slide-prev');
var $BIG_IMG=this._TPL_OBJ.find('.bigImg');
function moveCenter(){
if($SELECTOR.outerWidth()<$SELECTOR_WRAP.outerWidth()){
return;
}
var maxMoveNum=IMG_SLIDE_DATA.img_list.length-$SELECTOR_WRAP.outerWidth()/PER_WIDTH;
var cur=$('.active',$SELECTOR);
var center_left=$SELECTOR_WRAP.outerWidth()/2;
var now_left=$(cur).offset().left-$SELECTOR.offset().left+$(cur).outerWidth()/2;
var ml=now_left-center_left;
ml=Math.min(ml,maxMoveNum*PER_WIDTH);
$SELECTOR.animate({
marginLeft:ml>0?-ml:0
},300);
}
function moveRight(){
var maxMoveNum=IMG_SLIDE_DATA.img_list.length-$SELECTOR_WRAP.outerWidth()/PER_WIDTH;
maxMoveNum=maxMoveNum<=0?0:maxMoveNum;
var moveLeft=parseInt($SELECTOR.css('margin-left'));
var ml=(moveLeft-PER_WIDTH)>0?0:moveLeft-PER_WIDTH;
$SELECTOR.stop().animate({
marginLeft:Math.max(ml,-maxMoveNum*PER_WIDTH)
},300);
}
function moveLeft(){
var moveLeft=parseInt($SELECTOR.css('margin-left'));
if(moveLeft>=0){
return false;
}
$SELECTOR.stop().animate({
marginLeft:Math.min(moveLeft+PER_WIDTH,0)
},300);
}
function showBigImg($img){
$BIG_IMG.attr({
title:$img.attr('title'),
src:$img.data("big_img")
});
}
function changeSize()
{
var bigImgMaxHeight=$(window).height()-$SELECTOR_WRAP.outerHeight()-40;
$BIG_IMG.css("max-height",bigImgMaxHeight);
}
$(window).resize(function(){
changeSize();
});
$SLIDE_IMG.click(function(){
var _this=$(this);
var curId=parseInt(_this.data('img_id'));
var $active=$SELECTOR.find(".active");
if($active.length>0){
var activeId=parseInt($active.data('img_id'));
if(_this.hasClass("active")){
return false;
}
if(curId>activeId){
moveRight();
}
if(curId<activeId&&curId>=0){
moveLeft();
}
$active.removeClass("active");
_this.addClass("active");
}else{
_this.addClass("active");
moveCenter();
}
showBigImg(_this.find("img"));
});
$SLIDE_NEXT.click(function(){
var $next=$SELECTOR.find(".active").next();
if($next.length>0){
$next.click();
}else{
that._nextGroup();
}
});
$SLIDE_PREV.click(function(){
var $pre=$SELECTOR.find(".active").prev();
if($pre.length>0){
$pre.click();
}else{
that._preGroup();
}
});
$CLOSE_BTN.click(function(){
that.close();
});
},
show:function(){
this.handleEvent();
$('body').append(this._TPL_OBJ);
this._TPL_OBJ.find('[data-img_id='+IMG_SLIDE_DATA.current_img.index+']').click();
$(window).resize();
},
close:function(){
this._TPL_OBJ.remove();
}
};
return new IMG_SLIDE;
});
