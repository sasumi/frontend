define('ywj/richeditor', function(require){
	var Util = require('ywj/util');

	var MODE_BUTTON_LIST = {
		lite: ['undo', 'redo', 'fontfamily', 'fontsize', 'bold', 'italic', 'underline', 'strikethrough', 'removeformat',
			'forecolor', 'backcolor', 'formatmatch', 'insertorderedlist', 'insertunorderedlist',
			'link', 'unlink'],

		normal: [
			'fontfamily', 'fontsize', 'undo', 'redo', 'bold', 'italic', 'underline', 'strikethrough', 'removeformat', 'blockquote',
			'forecolor', 'backcolor', 'formatmatch', 'insertorderedlist', 'insertunorderedlist', 'selectall',
			'fullscreen', '|', 'wordimage',
			'inserttable', 'deletetable', 'insertparagraphbeforetable',
			'justifyleft', 'justifycenter', 'justifyright', 'justifyjustify', '|',
			'link', 'unlink', 'anchor', '|', 'imagenone', 'imageleft', 'imageright', 'imagecenter', '|',
			'simpleupload', 'source'
		]
	};

	var getUEBasePath = function() {
		var src = require.resolve('ueditor');
		return src.replace(/\/[^\/]+$/, '/');
	};

	var on_ue_load = [];
	var on_ui_ready = [];

	var UEDITOR_ON_LOAD = 'UEDITOR_ON_LOAD';
	var UEDITOR_HOME_URL = window.UEDITOR_HOME_URL || getUEBasePath();
	var UEDITOR_INT_URL = window.UEDITOR_INT_URL || UEDITOR_HOME_URL + 'php/controller.php';

	window.UE = {
		getUEBasePath: getUEBasePath
	};

	return {
		/**
		 * on editor ui render ready
		 * @param callback
		 */
		onEditorUIReady: function(callback){
			on_ui_ready.push(callback);
		},

		/**
		 * on UEditor class loaded
		 * @param callback
		 */
		onUELoad: function(callback){
			on_ue_load.push(callback)
		},

		/**
		 * 显示工具条按钮
		 * @param editor
		 * @param command
		 */
		showToolbarButton: function(editor, command){
			editor.ui.toolbars.forEach(function(toolbar){
				toolbar.items.forEach(function(item){
					if(item.className == 'edui-for-'+command){
						$(item.getDom()).find('.edui-icon').css('display', 'inline-block');
					}
				});
			});
		},

		getEditorByNode: function($node){
			var editor_id = $node.data('editor-id');
			if(editor_id){
				return UE.getEditor(editor_id);
			}
			return null;
		},

		/**
		 * 支持参数：name="" mode="lite", mode="normal" buttons="undo,redo,image..." morebuttons="link,unlink..."
		 * @param $node
		 * @param param
		 */
		nodeInit: function($node, param){
			var id = Util.guid();
			var name = $node.attr('name');
			var mode = param.mode || 'lite'; //默认使用lite类型
			var buttons = param.buttons ? [param.buttons.split(',')] : [MODE_BUTTON_LIST[mode]];
			var more_buttons = param.morebuttons ? param.morebuttons.split(',') : null;
			if(more_buttons){
				buttons[buttons.length-1] = buttons[buttons.length-1].concat(more_buttons);
			}

			var w = $node.width() || 400;
			var h = $node.height() || 300;

			$node.data('editor-id', id);

			//remove required attribute, avoid browser focus on a hidden textarea
			$node.hide().removeAttr('required');

			var script = '<script id="'+id+'" name="'+name+'" type="text/plain" style="width:'+w+'px; height:'+h+'px;"></script>';
			$(script).insertAfter($node);

			var UEDITOR_CONFIG = {
				UEDITOR_HOME_URL: UEDITOR_HOME_URL,                 //根目录
				serverUrl: UEDITOR_INT_URL,                         //服务器统一请求接口路径
				toolbars: buttons                                   //工具栏上的所有的功能按钮和下拉框，可以在new编辑器的实例时选择自己需要的从新定义
			};

			require.async('ueditor', function(){
				on_ue_load.forEach(function(cb){
					cb(UE);
				});

				var editor = UE.getEditor(id, UEDITOR_CONFIG);
				editor.addListener("ready", function(){
					editor.setContent('');
					editor.execCommand('insertHtml', $node.val(), true);
					editor.setHeight(h+'px');
					editor.addListener("contentchange", function () {
						$node.val(this.getContent()).trigger('change');
						window['EDITOR_CONTENT_CHANGED_FLAG'] = true;
					} );
				});
				editor.addListener('afteruiready', function(){
					on_ui_ready.forEach(function(cb){
						cb(editor);
					});
				});
			});
		}
	};
});