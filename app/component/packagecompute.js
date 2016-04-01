define("app/packagecompute", function(require){
	var $ = require("jquery");

	var UNIT_PRICE_WITH_FURNITURE = 999;  //含家具单价
	var UNIT_PRICE_WITHOUT_FURNITURE = 777; //不含家具单价
	var UNIT_EXTRA_HOUSE_WITH_FURNITURE = 6500; //含家具额外新增室的单价
	var UNIT_EXTRA_HOUSE_WITHOUT_FURNITURE = 3000; //不含家具新增房间的单价
	var UNIT_EXTRA_TOILET = 8800; //额外卫生间的价格
	var AREA_RATE = 0.75;  //面积转换率

	var AREA_MAP = {
		90:{
			room:2,
			office:2,
			kitchen:1,
			toilet:1,
			balcony:0
		},
		115:{
			room:3,
			office:2,
			kitchen:1,
			toilet:1,
			balcony:0
		},
		140:{
			room:4,
			office:2,
			kitchen:1,
			toilet:1,
			balcony:0
		},
		9999:{
			room:4,
			office:2,
			kitchen:1,
			toilet:2,
			balcony:0
		}
	};

	/**
	 *预估套餐价格
	 * @constructor
	 */
	function PackageCompute(config){
		this.config= $.extend({
			measure_area:0,
			room:0,
			toilet:0,
			without_furniture: true
		},config);

		/**
		 * 计算建筑面积
		 * @returns {number}
		 */
		this.getConstructArea = function(){
			return parseFloat(this.config.measure_area);
		};

		/**
		 * 计算总费用
		 * @returns {string}
		 */
		this.getTotalCost = function(){
			var construct_area = this.getConstructArea();
			var total;
			var standard_layout = {};
			var _area_int;
			var unit_price = this.config.without_furniture ? UNIT_PRICE_WITHOUT_FURNITURE : UNIT_PRICE_WITH_FURNITURE;
			for(var _area in AREA_MAP) {
				_area_int = parseInt(_area, 10);
				if(construct_area<_area_int){
					standard_layout = AREA_MAP[_area_int];
					break;
				}
			}

			var extra_room = this.config.room-standard_layout.room;
			var extra_toilet = this.config.toilet-standard_layout.toilet;
			//var extra_office=this.config.office-standard_layout.office;
			//var extra_kitchen=this.config.kitchen-standard_layout.kitchen;
			//var extra_balcony=this.config.balcony-standard_layout.room;

			if(construct_area<90){
				total = unit_price*90-(90-construct_area)*500;
			} else {
				total = unit_price*construct_area
			}
			total = total+extra_room* (this.config.without_furniture ? UNIT_EXTRA_HOUSE_WITHOUT_FURNITURE : UNIT_EXTRA_HOUSE_WITH_FURNITURE)+extra_toilet*UNIT_EXTRA_TOILET;
			return Math.ceil(parseFloat(total, 10));
		}
	}

	return PackageCompute;
});