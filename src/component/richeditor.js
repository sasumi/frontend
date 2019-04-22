/**
 * Created by Administrator on 2016/6/8.
 */
define('ywj/richeditor', function(require){
	var Util = require('ywj/util');
	return {
		getEditorByNode: function($node){
			var editor_id = $node.data('editor-id');
			if(editor_id){
				return UE.getEditor(editor_id);
			}
			return null;
		},

		nodeInit: function($node, param){
			var id = Util.guid();
			var name = $node.attr('name');
			$node.data('editor-id', id);
			var w = $node.width() || 400;
			var h = $node.height() || 300;
			//remove required attribute, avoid browser forcus on a hidden textarea
			$node.hide().removeAttr('required');

			var script = '<script id="'+id+'" name="'+name+'" type="text/plain" style="width:'+w+'px; height:'+h+'px;"></script>';
			$(script).insertAfter($node);

			var mode = param.mode || 'normal';
			require.async('ueditor_'+mode+'_config', function(config){
				require.async('ueditor', function(){
					window.UEDITOR_CONFIG = config;
					var ue = UE.getEditor(id);
					$node.change(function(){
						ue.setContent($node.val());
					});
					setTimeout(function(){
						ue.setContent($node.val());
						ue.setHeight(h+'px');
						ue.addListener( "contentchange", function () {
							window['EDITOR_CONTENT_CHANGED_FLAG'] = true;
						} );
					}, 1000);
				});
			});
		}
	};
});