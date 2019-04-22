/**
 * hooker
 * usage:
 * var MyHooker = Hooker(true);
 * MyHooker(function(name){
 *      console.log('hello', name);
 * });
 * MyHooker.listen(function(){
 *      console.log('good bye', name);
 * });
 * MyHooker.fire('world');
 */
define('ywj/hooker', function(require){
	var Util = require('ywj/util');

	/**
	 * 实例构造方法
	 * @param {Boolean} 缺省是否循环触发事件监听函数
	 */
	return function(default_recursive){
		var HK_MAP = [];
		var LAST_ARGS = [];
		var trigger_flag = false;

		//缺省调用为监听方法
		var hk = function(callback){
			return hk.listen(callback);
		};

		/**
		 * 事件触发（强制为异步）
		 * @returns {boolean|null}
		 */
		hk.fire = function(){
			if(!HK_MAP.length){
				return null;
			}
			var args = Util.toArray(arguments);
			LAST_ARGS = args;
			setTimeout(function(){
				var TMP_MAP = [];
				for(var i=0; i<HK_MAP.length; i++){
					var ret = HK_MAP[i].callback.apply(null, args);
					if(HK_MAP[i].recursive){
						TMP_MAP.push(HK_MAP[i]);
					}
					if(ret === false){
						return;
					}
				}
				HK_MAP = TMP_MAP;
			}, 0);
			return true;
		};

		/**
		 * 清空
		 */
		hk.clean = function(){
			HK_MAP = [];
		};

		/**
		 * 监听
		 * @param callback 回调处理函数
		 * @param recursive 是否重复执行
		 */
		hk.listen = function(callback, recursive){
			HK_MAP.push({
				callback: callback,
				recursive: recursive === undefined ? default_recursive : recursive
			});

			if(trigger_flag){
				hk.fire(LAST_ARGS);
			}
		};
		return hk;
	};
});