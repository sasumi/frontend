/**
 * Created by Administrator on 2016/6/8.
 */
define('ywj/richeditor', function(require){
	var Util = require('ywj/util');
	return {
		nodeInit: function($node){
			var txt = $node;
			var id = Util.guid();
			var name = txt.attr('name');
			var w = txt.width() || 400;
			var h = txt.height() || 300;
			txt.hide();

			var script = '<script id="'+id+'" name="'+name+'" type="text/plain" style="width:'+w+'px; height:'+h+'px;"></script>';
			$(script).insertAfter(txt);

			require.async('ueditor_admin_config', function(){
				require.async('ueditor', function(){
					var ue = UE.getEditor(id);
					setTimeout(function(){
						ue.setContent(txt.val());
						ue.setHeight(h+'px');
						ue .addListener( "contentchange", function () {
							window['EDITOR_CONTENT_CHANGED_FLAG'] = true;
						} );
					}, 1000);
				});
			});
		}
	};
});