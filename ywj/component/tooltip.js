/**
 * create by windy 2015/04/12
 */
define('ywj/tooltip', function(require){
	require('jquery/ui/tooltip');
	var msg_css_url = seajs.resolve('ywj/resource/tooltip.css');
	var top_doc;

	try {
		top_doc = parent.document;
	} catch(ex){}
	top_doc = top_doc || document;
	$('head', top_doc).append('<link rel="stylesheet" type="text/css" href="'+msg_css_url+'"/>');
});