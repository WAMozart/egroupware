/**
 * EGroupware - Calendar - Javascript UI
 *
 * @link http://www.egroupware.org
 * @package calendar
 * @author Hadi Nategh	<hn-AT-stylite.de>
 * @copyright (c) 2008-13 by Ralf Becker <RalfBecker-AT-outdoor-training.de>
 * @license http://opensource.org/licenses/gpl-license.php GPL - GNU General Public License
 * @version $Id$
 */

/**
 * UI for calendar
 *
 * @augments AppJS
 */
app.classes.calendar = AppJS.extend(
{
	/**
	 * application name
	 */
	appname: 'calendar',
	/**
	 * et2 widget container
	 */
	et2: null,
	/**
	 * edit_series vars
	 */
	calendar_edit_id: null,
	calendar_edit_date: null,
	/**
	 * Constructor
	 *
	 * @memberOf app.calendar
	 */
	init: function()
	{
		// call parent
		this._super.apply(this, arguments);
	},

	/**
	 * Destructor
	 */
	destroy: function()
	{
		delete this.et2;
		// call parent
		this._super.apply(this, arguments);

	},

	/**
	 * This function is called when the etemplate2 object is loaded
	 * and ready.  If you must store a reference to the et2 object,
	 * make sure to clean it up in destroy().
	 *
	 * @param et2 etemplate2 Newly ready object
	 */
	et2_ready: function(et2)
	{
		// call parent
		this._super.apply(this, arguments);
		var content = this.et2.getArrayMgr('content');

		if (typeof et2.templates['calendar.list'] != 'undefined')
		{
			this.filter_change();
		}
		if (typeof et2.templates['calendar.edit'] != 'undefined' && typeof content.data['conflicts'] == 'undefined')
		{
			$j(document.getElementById('calendar-edit_calendar-delete_series')).hide();
			//Check if it's fallback from conflict window or it's from edit window
			if (content.data['button_was'] != 'freetime')
			{
				this.set_enddate_visibility();
				this.check_recur_type();
				this.et2.getWidgetById('recur_exception').set_disabled(typeof content.data['recur_exception'][0] == 'undefined');
			}
			else
			{
				this.freetime_search();
			}
			//send Syncronus ajax request to the server to unlock the on close entry
			//set onbeforeunload with json request to send request when the window gets close by X button
			window.onbeforeunload = function () {
				this.egw.json('calendar.calendar_uiforms.ajax_unlock'
				, [content.data['id'],content.data['lock_token']],null,true,null,null).sendRequest(true);
			};
		}
		//this.replace_eTemplate_onsubmit();
		if (typeof et2.templates['calendar.freetimesearch'] != 'undefined')
		{
			this.set_enddate_visibility();
		}
	},

	/**
	 * open the freetime search popup
	 *
	 */
	 freetime_search_popup: function(_link)
	 {
		this.egw.open_link(_link,'ft_search','700x500') ;
	 },

	/**
	 * send an ajax request to server to set the freetimesearch window content
	 *
	 */
	freetime_search: function()
	{
		var content = this.et2.getArrayMgr('content').data;
		content['start'] = this.et2.getWidgetById('start').get_value();
		content['end'] = this.et2.getWidgetById('end').get_value();
		content['duration'] = this.et2.getWidgetById('duration').get_value();

		var request = this.egw.json('calendar.calendar_uiforms.ajax_freetimesearch', [content],null,null,null,null);
		request.sendRequest();
	},

	/**
	 * Function for disabling the recur_data multiselect box
	 *
	 */
	check_recur_type: function()
	{
		var recurType = this.et2.getWidgetById('recur_type');
		var recurData = this.et2.getWidgetById('recur_data');

		if(recurType && recurData)
		{
			recurData.set_disabled(recurType.get_value() != 2);
		}
	},

	/**
	 * Show/Hide end date, for both edit and freetimesearch popups,
	 * based on if "use end date" selected or not.
	 *
	 */
	set_enddate_visibility: function()
	{
		var duration = this.et2.getWidgetById('duration');
		var end = this.et2.getWidgetById('end');
		if (typeof duration != 'undefined' && typeof end != 'undefined')
		{
			end.set_disabled(duration.get_value()!=='');
		}
	},

	/**
	 * handles actions selectbox in calendar edit popup
	 *
	 * @param {widget object} widget, widget "actions selectBox" in edit popup window
	 */
	 actions_change: function(egw,widget)
	 {
		var event = this.et2.getArrayMgr('content').data;
		if (widget)
		{
			var id = this.et2.getArrayMgr('content').data['id'];
			switch (widget.get_value())
			{
				case 'print':
					this.egw.open_link('calendar.calendar_uiforms.edit&cal_id='+id+'&print=1','_blank','700x700');
					this.et2._inst.submit();
					break;
				case 'mail':
					this.egw.json('calendar.calendar_uiforms.ajax_custom_mail', [event, !event['id'], false],null,null,null,null).sendRequest();
					this.et2._inst.submit();
					break;
				case 'sendrequest':
					this.egw.json('calendar.calendar_uiforms.ajax_custom_mail', [event, !event['id'], true],null,null,null,null).sendRequest();
					this.et2._inst.submit();
					break;
				case 'infolog':
					this.egw.open_link('infolog.infolog_ui.edit&action=calendar&action_id='+($j.isPlainObject(event)?event['id']:event),'_self','700x600','infolog');
					this.et2._inst.submit();
					break;
				default:
					this.et2._inst.submit();
			}
		}
	 },
	/**
	 * open mail compose popup window
	 *
	 * @param {Array} vars,
	 * @todo need to provide right mail compose from server to custom_mail function
	 */
	 custom_mail: function (vars)
	 {
		this.egw.open_link('mail.mail_compose.compose&','_blank','700x700');
	 },
	/**
	 * control delete_series popup visibility
	 *
	 * @param {Array} exceptions, an array contains number of exception entries
	 *
	 */
	 delete_btn: function(exceptions)
	 {
		 var content = this.et2.getArrayMgr('content').data;

		 if (exceptions)
		 {

			$j(document.getElementById('calendar-edit_calendar-delete_series')).show();
		 }
		 else if (content['recur_type'] !== 0)
		 {
			 return confirm('Delete this series of recuring events');
		 }
		 else
		 {
			 return confirm('Delete this event');
		 }
	 },

	/**
	 * print_participants_status(egw,widget)
	 * Handle to apply changes from status in print popup
	 *
	 * @param {widget object} widget, widget "status" in print popup window
	 *
	 */
	 print_participants_status: function(egw,widget)
	 {
		if (widget && window.opener)
		{
			//Parent popup window
			var editPopWindow = window.opener;

			if (editPopWindow)
			{
				//Update paretn popup window
				editPopWindow.etemplate2.getByApplication('calendar')[0].widgetContainer.getWidgetById(widget.id).set_value(widget.get_value());
			}
			this.et2._inst.submit();

			editPopWindow.opener.egw_refresh('status changed','calendar');
		}
		else if (widget)
		{
			window.egw_refresh(this.egw.lang('The original popup edit window is closed! You need to close the print window and reopen the entry again.'),'calendar');
		}
	 },

	/**
	 * Handles to select freetime, and replace the selected one on Start,
	 * and End date&time in edit calendar entry popup.
	 *
	 * @param {widget object} _widget, widget "select button" in freetime search popup window
	 *
	 */
	 freetime_select: function(_egw,_widget)
	 {
		if (_widget)
		{
			var content = this.et2._inst.widgetContainer.getArrayMgr('content').data;
			// Make the Id from selected button by checking the index
			var selectedId = _widget.id.match(/^select\[([0-9])\]$/i)[1];

			var sTime = this.et2.getWidgetById(selectedId+'start');

			var eTime = this.et2.getWidgetById(selectedId+'[end]');
			 //Catches the start time from freetime content
			var str = sTime.get_value();

			var end = parseInt(str) + parseInt(content['duration']);

			//check the parent window is still open before to try to access it
			if (window.opener)
			{
				var editWindowObj = window.opener.etemplate2.getByApplication('calendar')[0];
				if (typeof editWindowObj != "undefined")
				{
					var startTime = editWindowObj.widgetContainer.getWidgetById('start');
					var endTime = editWindowObj.widgetContainer.getWidgetById('end');
					if (startTime && endTime)
					{
						startTime.set_value(str);
						endTime.set_value(end);
					}
				}
			}
			else
			{
				alert(this.egw.lang('The original calendar edit popup is closed!'));
			}
		}
		window.close();
	 },

	/**
	 * show/hide the filter of nm list in calendar listview
	 *
	 */
	filter_change: function()
	{
		var filter = this.et2.getWidgetById('filter');
		var dates = this.et2.getWidgetById('calendar.list.dates');

		if (filter && dates)
		{
			dates.set_disabled(filter.value !== "custom");
		}
	},

	/**
	 * this function try to fix ids which are from integrated apps
	 *
	 */
	cal_fix_app_id: function(_action, _senders)
	{
		var app = 'calendar';
		var id = _senders[0].id;
		var matches = id.match(/^(?:calendar::)?([0-9]+)(:([0-9]+))?$/);
		if (matches)
		{
			id = matches[1];
		}
		else if (matches = id.match(/^([a-z_-]+)([0-9]+)/i))
		{
			app = matches[1];
			id = matches[2];
		}
		var backup_url = _action.data.url;

		_action.data.url = _action.data.url.replace(/(\$|%24)id/,id);
		_action.data.url = _action.data.url.replace(/(\$|%24)app/,app);

		nm_action(_action, _senders);

		_action.data.url = backup_url;	// restore url
	},

	/**
	 * Open calendar entry, taking into accout the calendar integration of other apps
	 *
	 * calendar_uilist::get_rows sets var js_calendar_integration object
	 *
	 * @param _action
	 * @param _senders
	 *
	 */
	cal_open: function(_action, _senders)
	{
		var js_integration_data = this.et2.getArrayMgr('content').data.nm.js_integration_data;
		var id = _senders[0].id;
		var matches = id.match(/^(?:calendar::)?([0-9]+):([0-9]+)$/);
		var backup = _action.data;
		if (matches)
		{
			this.edit_series(matches[1],matches[2]);
			return;
		}
		else if (matches = id.match(/^([a-z_-]+)([0-9]+)/i))
		{
			var app = matches[1];
			_action.data.url = window.egw_webserverUrl+'/index.php?';
			var get_params = js_integration_data[app].edit;
			get_params[js_integration_data[app].edit_id] = matches[2];
			for(var name in get_params)
				_action.data.url += name+"="+encodeURIComponent(get_params[name])+"&";

			if (js_integration_data[app].edit_popup &&
				(matches = js_integration_data[app].edit_popup.match(/^(.*)x(.*)$/)))
			{
				_action.data.width = matches[1];
				_action.data.height = matches[2];
			}
			else
			{
				_action.data.nm_action = 'location';
			}
		}
		egw.open(id.replace(/^calendar::/g,''),'calendar','edit');
		_action.data = backup;	// restore url, width, height, nm_action
	},

	/**
	 * Delete calendar entry, asking if you want to delete series or exception
	 *
	 *
	 * @param _action
	 * @param _senders
	 */
	cal_delete: function(_action, _senders)
	{
		var backup = _action.data;
		var matches = false;

		// Loop so we ask if any of the selected entries is part of a series
		for(var i = 0; i < _senders.length; i++)
		{
			var id = _senders[i].id;
			if(!matches)
			{
				matches = id.match(/^(?:calendar::)?([0-9]+):([0-9]+)$/);
			}
		}
		if (matches)
		{
			var id = matches[1];
			var date = matches[2];
			var popup = jQuery(document.getElementById(_action.getManager().etemplate_var_prefix + '[' + _action.id + '_popup]'));
			var row = null;

			// Cancel normal confirm
			delete _action.data.confirm;
			delete _action.data.confirm_multiple;

			// nm action - show popup
			nm_open_popup(_action,_senders);

			if(!popup)
			{
				return;
			}
			if (row = jQuery("#"+id+"\\:"+date)) {
				// Open at row
				popup.css({
					position: "absolute",
					top: row.position().top + row.height() -popup.height()/2,
					left: $j(window).width()/2-popup.width()/2
				});
			} else {
				// Open popup in the middle
				popup.css({
					position: "absolute",
					top: $j(window).height()/2-popup.height()/2,
					left: $j(window).width()/2-popup.width()/2
				});
			}
			return;
		}

		console.log(_action);
		nm_action(_action, _senders);

		_action.data = backup;	// restore url, width, height, nm_action
	},

	/**
	 * Create edit exception dialog for recurrence entries
	 *
	 * @param {timestamp} date
	 * @param {string} id, cal_id
	 * @param {type} name description
	 */
	edit_series: function(event,id,date)
	{

		// Coming from list, there is no event
		if(arguments.length == 2)
		{
			date = id;
			id = event;
			event = null;
		}
		calendar_edit_id = id;
		calendar_edit_date = date;
		var that = this;
		var buttons = [
			{text: this.egw.lang("Edit exception"), id: "exception", class: "ui-priority-primary", "default": true},
			{text: this.egw.lang("Edit series"), id:"series"},
			{text: this.egw.lang("Cancel"), id:"cancel"},
		];
		var callbackExceptionDialog = function (button_id)
		{
			switch(button_id)
			{
				case 'exception':
					that.open_edit(false);
					break;
				case 'series':
					that.open_edit(true);
					break;
				case 'cancel':

				default:
					break;
			}
		}
		var confirmExcDialog = et2_dialog.show_dialog(callbackExceptionDialog, this.egw.lang("Do you want to edit this event as an exception or the whole series?"),this.egw.lang("This event is part of a series"), {},buttons, et2_dialog.WARNING_MESSAGE);
	},

	/**
	 * open calendar entry with the proper url either as series modifiction or exception modification
	 *
	 */
	open_edit: function(series)
	{
		this.egw.open(calendar_edit_id,'calendar','edit','&date='+calendar_edit_date
				+(!series?'&exception=1':''));
	},
});
