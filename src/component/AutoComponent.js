/**
 * Created by Administrator on 2016/6/12.
 */
define('ywj/AutoComponent', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');
	var COMPONENT_FLAG_KEY = 'component';
	var COMPONENT_BIND_FLAG_KEY = 'component-init-bind';
	var SUPPORT_EVENTS = 'click mousedown mouseup keydown keyup';
	var DEFAULT_NS = 'ywj';
	var INIT_COMPLETED = false;
	var INIT_CALLBACK = [];

	var parseComponents = function(attr){
		var tmp = attr.split(',');
		var cs = [];

		$.each(tmp, function(k, v){
			v = $.trim(v);
			if(v){
				if(v.indexOf('/') >= 0){
					cs.push(v);
				} else {
					cs.push(DEFAULT_NS+'/'+v);
				}
			}
		});
		return cs;
	};

	var nodeHasComponent = function($node, component_name){
		var cs = parseComponents($node.data(COMPONENT_FLAG_KEY));
		return Util.inArray(component_name, cs);
	};

	var getDataParam = function($node){
		var param = {};
		for(var i=0; i<$node[0].attributes.length; i++){
			var attr = $node[0].attributes[i];
			if(attr.name.indexOf('data-') == 0){
				var data_str = attr.name.replace(/^data\-/i, '');
				if(data_str.indexOf('-') > 0){
					var component_name = data_str.substring(0, data_str.indexOf('-'));
					component_name = component_name.replace(/_/, '/');
					if(!param[component_name]){
						param[component_name] = {};
					}
					var key = data_str.substring(data_str.indexOf('-')+1);
					param[component_name][key] = attr.value;
				} else {
					param[data_str] = attr.value;
				}
			}
		}
		return param;
	};

	/**
	 * 优先绑定jQuery事件
	 * @param $node
	 * @param event
	 * @param handler
	 */
	var bindUp = function($node, event, handler){
		$node.bind(event, handler);
		return;
		event = event.split(/\s+/);
		$node.each(function(){
			var len = event.length;
			while(len -- ){
				$node.bind(event[len], handler);
				var evts = $._data($node[0], 'events')[event[len]];
				evts.splice(0, 0, evts.pop());
			}
		})
	};

	$(function(){
		//使用异步，一定程度可以缓解data-component组件如果在调用AutoComponent组件方法的时候，
		//出现的互相嵌套等待的情况，但是这种情况是没太好的办法解耦。
		setTimeout(function(){
			var $body = $('body');
			var _LS = {};
			var bindNode = function(){
				$('[data-'+COMPONENT_FLAG_KEY+']').each(function(){
					var $node = $(this);
					if($node.data(COMPONENT_BIND_FLAG_KEY)){
						return;
					}
					$node.data(COMPONENT_BIND_FLAG_KEY, 1);
					var all_data = getDataParam($node);
					var cs = parseComponents($node.data(COMPONENT_FLAG_KEY));
					if(!_LS[cs]){
						console.log('%cLoad COM: '+cs.join(','), 'color:green');
						_LS[cs] = true;
					}
					require.async(cs, function(){
						var args = arguments;
						for(var i=0; i<cs.length; i++){
							var c = cs[i].replace(new RegExp('^'+DEFAULT_NS+'/'),'');
							if(!args[i]){
								continue;
							}
							if(Util.isFunction(args[i].nodeInit)){
								args[i].nodeInit($node, all_data[c] || {});
							}
						}
						bindUp($node, SUPPORT_EVENTS, function(e){
							var all_data = getDataParam($node);
							var ev = e.type;
							var method = 'node'+ev[0].toUpperCase()+ev.slice(1);
							for(var i=0; i<cs.length; i++){
								if(!args[i]){
									continue;
								}
								var c = cs[i].replace(new RegExp('^'+DEFAULT_NS+'/'),'');
								if(Util.isFunction(args[i][method])){
									if(args[i][method]($node, all_data[c] || {}) === false){
										e.stopImmediatePropagation(); //stop other jQuery event binding
										e.preventDefault();
										return false;
									}
								}
							}
						});
					});
				});
			};

			var m_tm = null;
			$body.on('DOMSubtreeModified propertychange', function() {
				clearTimeout(m_tm);
				m_tm = setTimeout(function(){bindNode();}, 100);
			});
			bindNode();

			INIT_COMPLETED = true;
			$.each(INIT_CALLBACK, function(k, v){
				v();
			});
		}, 0);
	});

	return {
		parseComponents: parseComponents,
		nodeHasComponent: nodeHasComponent,
		initComplete: function(callback){
			if(INIT_COMPLETED){
				callback();
			} else {
				INIT_CALLBACK.push(callback);
			}
		}
	};
});