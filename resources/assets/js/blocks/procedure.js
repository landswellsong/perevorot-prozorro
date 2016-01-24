(function(){
	'use strict';
	return;

	var json;

	var BLOCK = function(){
		var _block;
	
		var query_types={
			order: 700,
			prefix: 'procedure',
			name: 'Тип процедури',
			button_name: 'Тип процедури',
			pattern_search: /^(.*?)$/,
			//pattern_exact: /^\d{1,8}-\d{1}$/,
			template: $('#block-procedure'),
			json: {
				check: '/form/check/procedure'
			},
			load: function(){
				if(!json){
					$.ajax({
						method: 'POST',
						url: '/form/data/procedure',
						dataType: 'json',
						headers: APP.utils.csrf(),
						success: function(response){
							json=response;
						}
					});
				}
			},
			init: function(input_query, block){
				var input=block.find('select'),
					preselected_value=block.data('preselected_value');
	
				_block=block;
	
				input.selectize({
					options: json,
					openOnFocus: true,
					closeAfterSelect: true,
					maxItems: 1,
					maxOptions: 50,
					labelField: 'name',
					valueField: 'id',
					searchField: [
						'name',
						'id'
					],
					render:{
						option: function(item, escape) {
							return '<div>'+item.name+'</div>';
						},
						item: function(item, escape) {
							return '<div>'+item.name+'</div>';
						}
					},
					onInitialize: function(){
						if(preselected_value){
							var preselected=INPUT.data('preselected');

							if(preselected[query_types.prefix] && preselected[query_types.prefix][preselected_value]) {
								this.addOption({
									id: preselected_value,
									name: preselected[query_types.prefix][preselected_value]
								});

								this.setValue(preselected_value);
								this.blur();
							}
						}else{
							this.open();

							this.$control_input.val(input_query);
							this.$control_input.trigger('update');

							this.$control_input.focus();
						}
					},
					onType: function(text){
						_block[!this.currentResults.items.length?'addClass':'removeClass']('no-results');
					},
					onChange: function(value){
						INPUT.focus();
						APP.utils.query();
					},
					onBlur: function(){
						_block.removeClass('no-results');
					}					
				});
				
				return this;
			},
			result: function(){
				var value=_block.find('[data-value]').data('value');

				return value!='' ? value : false;
			}
		}
		
		return query_types;
	}

	window.query_types=window.query_types||[];	
	window.query_types.push(BLOCK);
})();