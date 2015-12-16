/*!
 *
 * Prozorro v1.0.0
 *
 * Author: Lanko Andrey (lanko@perevorot.com)
 *
 * © 2015
 *
 */
var APP,
	INPUT,
	SEARCH_BUTTON,
	BLOCKS,
	SEARCH_QUERY=[],
	SEARCH_QUERY_TIMEOUT,

	IS_MAC = /Mac/.test(navigator.userAgent),

	KEY_BACKSPACE = 8,
	KEY_UP = 38,
	KEY_DOWN = 40,
	KEY_ESC = 27,
	KEY_RETURN = 13,
	KEY_CMD = IS_MAC ? 91 : 17;


(function(window, undefined){
	'use strict';

	var suggest_opened,
		suggest_current;

	APP = (function(){

		return {
			common: function(){
				$('html').removeClass('no-js');
			},

			js: {
				form: function(_self){
					var timeout,
						input_query='',
						$document=$(document);

					INPUT=_self;
					BLOCKS=$('#blocks');
					SEARCH_BUTTON=$('#search_button');
					
					setInterval(function(){
						if(input_query!=INPUT.val()){
							input_query=INPUT.val();

							if(input_query){
								clearTimeout(timeout);

								timeout=setTimeout(function(){
									APP.utils.suggest.show(input_query);
								}, 200);
							}

							if(INPUT.val()==''){
								APP.utils.suggest.clear();
							}
						}
					}, 100);

					setTimeout(function(){
						INPUT.val('');//03000000-1
						INPUT.attr('placeholder', INPUT.data('placeholder'));
						INPUT.focus();
					}, 500);

					SEARCH_BUTTON.click(function(){
						APP.utils.query();
					});
					
					BLOCKS.click(function(e){
						if($(e.target).closest('.block').length){
							return;
						}

						if(INPUT.val()!=''){
							$('#suggest').show();
						}
						
						INPUT.focus();
					});

					INPUT.focus(function(){
						if(INPUT.val()!=''){
							$('#suggest').show();
						}
					});
					
					$document.on('keydown', function(e) {
						_self.isCmdDown = e[IS_MAC ? 'metaKey' : 'ctrlKey'];
					});

					$document.on('keyup', function(e) {
						if (e.keyCode === KEY_CMD){
							_self.isCmdDown = false;
						}
					});
					
					INPUT.keydown(function(e){

						switch (e.keyCode){
							case 90://z
								if(_self.isCmdDown && INPUT.val()==''){
									//undelete
									return false;
								}
							break;
							
							case KEY_ESC:
								APP.utils.suggest.clear();
								return;
							break;

							case KEY_RETURN:
								$('#suggest a:eq('+suggest_current+')').click();

								return;
							break;

							case KEY_UP:
								if(APP.utils.suggest.opened()){
									if(suggest_current>0){
										suggest_current--;

										$('#suggest a').removeClass('selected');
										$('#suggest a:eq('+suggest_current+')').addClass('selected');

										return;
									}
								}
							break;

							case KEY_DOWN:
								if(APP.utils.suggest.opened()){
									if(suggest_current<$('#suggest a').length-1){
										suggest_current++;

										$('#suggest a').removeClass('selected');
										$('#suggest a:eq('+suggest_current+')').addClass('selected');

										return;
									}
								}							
							break;
							
							case KEY_BACKSPACE:
								if (INPUT.val()=='' && BLOCKS.find('.block').length){
									BLOCKS.find('.block:last').find('a.delete').click();

									return;
								}
							break;
						}
					});
					
					APP.utils.block.preload();
					APP.utils.block.buttons();

					$document.click(function(e){
						if(APP.utils.suggest.opened() && !$(e.target).closest('#blocks').length){
							$('#suggest').hide();
						}
					});

					$document.on('click', '#blocks a.delete', function(e){
						e.preventDefault();

						var block=$(this).closest('.block'),
							after_remove;

						if(typeof block.data('block').remove === 'function'){
							block.data('block').remove();
						}
						
						if(typeof block.data('block').after_remove === 'function'){
							after_remove=block.data('block').after_remove;
						}
						
						block.remove();

						if(after_remove){
							after_remove();
						}

						APP.utils.callback.remove();

						INPUT.focus();
						APP.utils.query();
					});
				}
			},
			utils: {
				query: function(){
					clearTimeout(SEARCH_QUERY_TIMEOUT);

					SEARCH_QUERY_TIMEOUT=setTimeout(function(){
						SEARCH_QUERY=[];
						
						$('.block').each(function(){
							var self=$(this),
								block=self.data('block'),
								type=block.prefix;

							if(typeof block.result === 'function'){
								var result=block.result();

								if(typeof result === 'object'){
									SEARCH_QUERY.push(result.join('&'));
								}else if(result){
									SEARCH_QUERY.push(type+'='+result);
								}
							}
						});

						$('#server_query').val(SEARCH_QUERY.join('&'));
						SEARCH_BUTTON.prop('disabled', SEARCH_QUERY.length?'':'disabled')

						if(!SEARCH_QUERY.length){
							$('#result').html('');

							return;
						}

						$('#result').html('Завантаження...');

						$.ajax({
							url: '/form/search?',
							data: {
								query: SEARCH_QUERY
							},
							method: 'post',
							headers: APP.utils.csrf(),
							dataType: "json",
							success: function(response){
								$('#result').html(response.html);
								return;
								var out=[];

								for(var ii=0;ii<response.res.hits.length;ii++){
									var item=response.res.hits[ii];
									var it=[];
	
									if(item._source.items && item._source.items.length){
										for(var i=0;i<item._source.items.length;i++){
											it.push('<div>'+item._source.items[i].classification.description+' #'+item._source.items[i].classification.id+'</div>')
										};
									}
	
									out.push('<h4>'+item._source.title+'</h4>'+it.join('')+(item._source.tenderPeriod?'<div>'+item._source.tenderPeriod.startDate+'—'+item._source.tenderPeriod.endDate+'</div>':''));
								};
	
								if(response.res.hits.length){
									$('#result').html(out.join(''));
								}else{
									$('#result').html('Жодних результатiв');
								}
							}
						});
					}, 300);
				},
				block: {
					remove: function(e){
						e.preventDefault();
						
					},
					create: function(block_type){
						for(var i=0; i<window.query_types.length; i++){
							if(typeof window.query_types[i] === 'function'){
								var type=window.query_types[i]();
								
								if(type.prefix==block_type){
									return type;
								}
							}
						}						
					},
					add: function(self){
						var input_query=self.data('input_query'),
							block_type=self.data('block_type'),
							block=APP.utils.block.create(block_type),
							template=block.template ? block.template.clone().html() : null,
							is_exact=false//(type.pattern_exact && type.pattern_exact.test(input))

						if(template){
							block.value=input_query;
							template=APP.utils.parse_template(template, block);
						}else{
							template=input;
						}

						INPUT.removeClass('no_blocks').removeAttr('placeholder');

						if(self.data('preselected_value')){
							template.data('preselected_value', self.data('preselected_value'));
						}

						template.append('<a href="" class="delete">×</a>');

						BLOCKS.append(template);
						BLOCKS.append(INPUT);

						if(typeof block.init === 'function'){
							block=block.init(input_query, template);
						}else{
							INPUT.focus();
						}
						
						if(typeof block.after_add === 'function'){
							block.after_add();
						}						
						
						template.data('block', block);

						INPUT.val('');
					},
					preload: function(){
						for(var i=0; i<window.query_types.length; i++){
							if(typeof window.query_types[i] === 'function'){
								var type=window.query_types[i]();

								if(typeof type.load === 'function'){
									type.load();
								}
							}
						}						
					},
					buttons: function(){
						var button_blocks=[];
						
						for(var i=0; i<window.query_types.length; i++){
							if(typeof window.query_types[i] === 'function'){
								var type=window.query_types[i]();

								if(type.button_name){
									button_blocks.push(type);
								}
							}
						}
	
						button_blocks.sort(function(a, b){
							if (a.order < b.order)
								return -1;
	
							if (a.order > b.order)
								return 1;
	
							return 0;
						});
						
						for(var i=0; i<button_blocks.length; i++){
							APP.utils.button.add(button_blocks[i]);
						}
					}
				},
				callback: {
					remove: function(){
						if(!BLOCKS.find('.block').length){
							INPUT.addClass('no_blocks');
							INPUT.attr('placeholder', INPUT.data('placeholder'));
						}
					},
					check: function(suggest){
						return function(response, textStatus, jqXHR){
							if(response){
								suggest.removeClass('none');
							}else{
								suggest.remove();
							}
						}
					}
				},
				button: {
					add: function(block){
						var button=$('#helper-button').clone().html();

						button=$(button.replace(/\{name\}/, block.button_name));

						button.data('input_query', '');
						button.data('block_type', block.prefix);

						button.click(function(e){
							e.preventDefault();

							APP.utils.block.add($(this));
						});
						
						$('#buttons').append(button);
					}
				},
				suggest: {
					show: function(input_query){
						var blocks=APP.utils.detect_query_block(input_query),
							row,
							item;

						APP.utils.suggest.clear();

						if(blocks.length){
							$.each(blocks, function(index, block){
								row=$('#helper-suggest').clone().html();

								if(typeof block.suggest_item=='function'){
									row=block.suggest_item(row, input_query);
								}else{
									row=row.replace(/\{name\}/, block.name);
									row=row.replace(/\{value\}/, input_query);
								}

								if(row){
									item=$(row);
	
									if(input_query && block.json && block.json.check){
										$.ajax({
											method: 'POST',
											url: block.json.check,
											dataType: 'json',
											headers: APP.utils.csrf(),
											data: {
												query: input_query
											},
											success: APP.utils.callback.check(item)
										});
									}else{
										item.removeClass('none');
									}
	
									item.data('input_query', input_query);
									item.data('block_type', block.prefix);
	
									item.click(function(e){
										e.preventDefault();
	
										APP.utils.block.add($(this));
									});
	
									$('#suggest').append(item);
								}
							});

							$('#suggest a:first').addClass('selected');

							$('#suggest').show();
							
							suggest_opened=true;
						}
					},
					clear: function(){
						$('#suggest').hide().empty();
						suggest_current=0;
						suggest_opened=false;
					},
					opened: function(){
						return suggest_opened;
					}
				},
				detect_query_block: function(query){
					var types=[];

					for(var i=0; i<window.query_types.length; i++){
						if(typeof window.query_types[i] === 'function'){
							var type=window.query_types[i]();
							
							if(type.pattern_search.test(query)){
								types.push(type);
							}
						}
					}

					types.sort(function(a, b){
						if (a.order < b.order)
							return -1;

						if (a.order > b.order)
							return 1;

						return 0;
					});
		
					return types;
				},
				parse_template: function(template, data){
					for(var i in data){
						template=template.replace(new RegExp('{' + i + '}', 'g'), data[i]);
					}
					
					return $(template);
				},
				csrf: function(){
					return {
						'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
					};
				}
			}
		};
	}());

	APP.common();

	$(function (){
		$('[data-js]').each(function(){
			var self = $(this);

			if (typeof APP.js[self.data('js')] === 'function'){
				APP.js[self.data('js')](self, self.data());
			} else {
				console.log('No `' + self.data('js') + '` function in app.js');
			}
		});
	});

})(window);

String.prototype.trunc = String.prototype.trunc || function(n){
	return (this.length > n) ? this.substr(0, n-1)+'&hellip;' : this;
};
/*
$.ajaxSetup({
   headers : {'X-CSRF-TOKEN' : $('meta[name="csrf-token"]').attr('content')}
});
*/