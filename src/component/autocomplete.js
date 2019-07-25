/**
 * 自动完成输入框
 * CGI返回格式：{code:0, message, data:[{title:'标题', value:'值', disabled:true},...]}
 * 组件会考量required、strict参数
 */
define('ywj/autocomplete', function(require){
	require('ywj/resource/autocomplete.css');
	var $ = require('jquery');
	require('jquery/highlight');
	var Util = require('ywj/util');
	var Net = require('ywj/net');

	var PANEL_CLASS = 'ywj-autocomplete-panel';
	var PANEL_ERROR_CLASS = 'ywj-autocomplete-panel-error';
	var PANEL_SUCCESS_CLASS = 'ywj-autocomplete-panel-success';
	var PANEL_LOADING_CLASS = 'ywj-autocomplete-panel-loading';
	var INPUT_LOADING = 'ywj-autocomplete-input-loading';
	var INPUT_MISS_MATCH = 'ywj-autocomplete-input-miss-match';
	var PANEL_ITEM_FOCUS_CLASS = 'ywj-autocomplete-item-focus';
	var PANEL_ITEM_DISABLED_CLASS = 'ywj-autocomplete-item-disabled';

	return {
		/**
		 * 节点初始化
		 * @param $node 支持Input、Select两种节点
		 * @param param
		 */
		nodeInit: function($node, param){
			if($node.attr('readonly') || $node.attr('disabled')){
				return;
			}
			if(!param.source){
				console.warn('No cgi source found using autocomplete component');
				return;
			}
			if($node[0].tagName == 'INPUT'){
				$node.attr('autocomplete', 'off');
			}
			var onselect = param.onselect || function(){};
			if(Util.isString(onselect)){
				onselect = window[onselect];
			}

			//默认严格模式
			var IS_SELECT = $node[0].tagName == 'SELECT';
			var strict = param.strict === undefined ? true : !!param.strict;
			var required = $node.attr('required');
			var disabled = $node.attr('disabled');
			var css_class = $node.attr('class') || '';

			var get_node_text = function($node){
				return IS_SELECT ? $node.find('option:selected').text() : $node.val();
			};

			var set_node_data = function(value, title){
				return IS_SELECT ? $node.html('<option value="'+Util.htmlEscape(value)+'">'+Util.htmlEscape(title)+'</option>') : $node.val(value);
			};

			var $shadow_inp = $node;
			if(strict){
				disabled = disabled ? 'disabled="' + disabled + '"' : '';
				$shadow_inp = $('<input type="text" value="'+get_node_text($node)+'" '+disabled+' class="'+css_class+'" placeholder="'+($node.attr('placeholder') || '')+'">').insertBefore($node);
				$node.css({
					transition: 'none',
					position: 'absolute',
					width: 0,
					height:0,
					padding:0,
					left: $shadow_inp.offset().left + $shadow_inp.outerWidth()/2,
					top: $shadow_inp.offset().top + $shadow_inp.outerHeight(),
					opacity: 0
				});

				$node.change(function(){
					$shadow_inp.val(get_node_text($node));
				});

				$shadow_inp.blur(function(){
					$node.trigger('blur');
				});
			}

			var _stop_load_ = false;
			$shadow_inp.on('keydown keyup change mouseup', function(e){
				if(is_node_disabled()){
					return;
				}
				if(e.keyCode == Util.KEYS.UP){
					move_cursor(true);
					return false;
				}else if(e.keyCode == Util.KEYS.DOWN){
					move_cursor();
					return false;
				}else if(e.keyCode == Util.KEYS.ENTER){
					if($PANEL.is(':visible') && $PANEL.find('.'+PANEL_ITEM_FOCUS_CLASS).size()){
						if(select_item($PANEL.find('.'+PANEL_ITEM_FOCUS_CLASS), true)){
							hide_panel();
							_stop_load_ = true;
							setTimeout(function(){
								_stop_load_ = false;
							}, 100);
						}
						return false;
					}
				} else {
					if(!_stop_load_){
						load_data($shadow_inp.val());
					}
				}
				if(!strict){
					$node.val($shadow_inp.val());
				}
			});

			var LAST_DATA = [];
			var $PANEL;
			var create_panel = function(){
				if(!$PANEL){
					$PANEL = $('<dl class="'+PANEL_CLASS+'"><dt></dt></dl>').appendTo('body').css({
						width: $shadow_inp.outerWidth()
					});
					$PANEL.delegate('dd', 'mousedown', function(){
						if(select_item($(this), true)){
							hide_panel();
						}
					});
					$('body').click(function(e){
						var tag = e.target;
						if(tag == $shadow_inp[0] || $.contains($PANEL[0], tag) || $PANEL[0] == tag){
							//hits
						} else {
							if($PANEL.is(':visible') && select_item($PANEL.find('.'+PANEL_ITEM_FOCUS_CLASS), true)){
								hide_panel();
							}
						}
					});
				}
				$PANEL.html('')
					.show()
					.removeClass(PANEL_LOADING_CLASS)
					.removeClass(PANEL_SUCCESS_CLASS)
					.removeClass(PANEL_ERROR_CLASS)
					.html('')
					.css({
						left: $shadow_inp.offset().left,
						top: $shadow_inp.offset().top + $shadow_inp.outerHeight()
					});
				$shadow_inp.removeClass(INPUT_LOADING).removeClass(INPUT_MISS_MATCH);
			};

			/**
			 * 方向键移动
			 * @param up_dir
			 */
			var _mc_tm;
			var move_cursor = function(up_dir){
				var idx = $PANEL.find('.'+PANEL_ITEM_FOCUS_CLASS).index()-1;
				var size = $PANEL.find('dd').size();
				$PANEL.find('dd').removeClass(PANEL_ITEM_FOCUS_CLASS);
				var tag = 0;
				if(up_dir){
					tag = idx > 0 ? idx - 1 : size-1;
				} else {
					tag = idx >= (size-1) ? 0 : idx + 1;
				}
				var $dd = $PANEL.find('dd').eq(tag);
				$dd.addClass(PANEL_ITEM_FOCUS_CLASS);
				select_item($dd);

				clearTimeout(_mc_tm);
				_stop_load_ = true;
				_mc_tm = setTimeout(function(){
					_stop_load_ = false;
				}, 500);
			};

			/**
			 * 推送选择项
			 * @param $dd
			 * @param clear
			 */
			var select_item = function($dd, clear){
				clearTimeout(_mc_tm);
				_stop_load_ = true;
				_mc_tm = setTimeout(function(){
					_stop_load_ = false;
				}, 500);

				if(!$dd.size()){
					return false;
				}
				var data = LAST_DATA[$dd.index()-1];
				if(data.disabled){
					console.log('disabled');
					return false;
				}

				$shadow_inp.val(data.title);
				set_node_data(data.value, data.title);
				onselect(data, $node);

				//avoid trigger body click event, cause flush again.
				if(clear){
					$PANEL.find('dd').removeClass(PANEL_ITEM_FOCUS_CLASS);
				}
				return true;
			};

			var show_panel = function(list, message, error){
				if(is_node_disabled()){
					return;
				}
				create_panel();
				if(error){
					$PANEL.addClass(PANEL_ERROR_CLASS).html('<dt>'+Util.htmlEscape(message)+'</dt>');
				} else {
					LAST_DATA = list;
					if(!LAST_DATA || !LAST_DATA.length){
						show_empty();
					} else {
						var html = '<dt>'+Util.htmlEscape(message)+'</dt>';
						for(var i=0; i<list.length; i++){
							html += '<dd '+(list[i].disabled ? '' : 'tabindex="0"')+' class="'+(list[i].disabled ? PANEL_ITEM_DISABLED_CLASS : '')+'">';
							html += Util.htmlEscape(list[i].title);
							html += '</dd>';
						}
						$PANEL.addClass(PANEL_SUCCESS_CLASS).html(html);
						$PANEL.find('dd').eq(0).addClass(PANEL_ITEM_FOCUS_CLASS);
						$PANEL.find('dd').highlight($.trim($shadow_inp.val()));
					}
				}
			};

			var show_empty = function(){
				create_panel();
				$PANEL.addClass(PANEL_ERROR_CLASS).html('<dt>没有匹配结果</dt>');
				if(strict){
					$shadow_inp.addClass(INPUT_MISS_MATCH);
				}
			};

			var is_node_disabled = function(){
				return $node.attr('readonly') || $node.attr('disabled');
			};

			var show_loading = function(){
				create_panel();
				$PANEL.addClass(PANEL_LOADING_CLASS).html('<dt>loading...</dt>');
				$shadow_inp.addClass(INPUT_LOADING);
			};

			var hide_panel = function(){
				$PANEL && $PANEL.hide();
				$shadow_inp.removeClass(INPUT_LOADING);
			};

			//前端缓存
			var CACHE_MAP = {};
			var tm = null;
			var load_data = function(keyword){
				clearTimeout(tm);
				keyword = $.trim(keyword);
				if(!keyword){
					hide_panel();
					return;
				}
				var cb = function(rsp){
					if(rsp.code == 0){
						show_panel(rsp.data, rsp.message);
					} else {
						show_panel(null, rsp.message, true);
					}
					CACHE_MAP[keyword] = rsp;
				};
				if(CACHE_MAP[keyword]){
					cb(CACHE_MAP[keyword]);
					return;
				}
				show_loading();
				tm = setTimeout(function(){
					Net.get(param.source, {keyword:keyword}, cb, {frontCache: true});
				}, 200);
			};
		}
	};
});