/**
 * EGroupware eTemplate2 - JS Tabs object
 *
 * @license http://opensource.org/licenses/gpl-license.php GPL - GNU General Public License
 * @package etemplate
 * @subpackage api
 * @link http://www.egroupware.org
 * @author Andreas Stöckel
 * @copyright Stylite 2011
 * @version $Id$
 */

/*egw:uses
	jsapi.egw;
	/vendor/bower-asset/jquery/dist/jquery.js;
	et2_core_valueWidget;
*/

/**
 * Class which implements the tabbox-tag
 *
 * @augments et2_valueWidget
 */
var et2_tabbox = (function(){ "use strict"; return et2_valueWidget.extend([et2_IInput,et2_IResizeable],
{
	attributes: {
		'tabs': {
			'name': 'Tabs',
			'default': et2_no_init,
			'description': "Array of [extra] tabs.  Each tab needs {label:..., template:...}.  Additional optional keys are prepend, hidden and id, for access into content array"
		},
		'add_tabs': {
			'name': 'Add tabs',
			'default': false,
			'description': 'Set to true if tabs should be added to tabs from read from template, default false if not'
		},
		'tab_height': {
			name: 'Tabs innerHeight',
			default: '',
			description: 'Set the innerHeight for the tab content'
		},
		'align_tabs': {
			name: 'Tabs alignment',
			type: 'string',
			default: 'h',
			description: 'Set tabs and their headers arrangment either horizental (h) or vertical (v). Default value is horizental.'
		}
	},

	/**
	 * Currently selected tab
	 */
	selected_index: 0,

	/**
	 * Construtor
	 *
	 * @memberOf et2_tabbox
	 */
	init: function() {
		// Create the outer tabbox container
		this.container = jQuery(document.createElement("div"))
			.addClass("et2_tabbox");

		// Create the upper container for the tab flags
		this.flagContainer = jQuery(document.createElement("div"))
			.addClass("et2_tabheader")
			.appendTo(this.container);

		// Create the lower tab container
		this.tabContainer = jQuery(document.createElement("div"))
			.addClass("et2_tabs")
			.appendTo(this.container);

		this._super.apply(this, arguments);

		this.tabData = [];
	},

	destroy: function() {
		this._super.apply(this, arguments);

		this.container = null;
		this.flagContainer = null;
		this.tabData = [];
	},

	_readTabs: function(tabData, tabs) {
		var selected = "";
		this.selected_index = false;
		var hidden = {};
		if (this.id)
		{
			// Set the value for this element
			var contentMgr = this.getArrayMgr("content");
			if (contentMgr != null) {
				var val = contentMgr.getEntry(this.id);
				if (val !== null)
				{
					selected = val;
				}
			}
			contentMgr = this.getArrayMgr("readonlys");
			if (contentMgr != null) {
				var val = contentMgr.getEntry(this.id);
				if (val !== null && typeof val !== 'undefined')
				{
					hidden = val;
				}
			}
		}
		var i = 0;
		et2_filteredNodeIterator(tabs, function(node, nodeName) {
			if (nodeName == "tab")
			{
				var index_name = et2_readAttrWithDefault(node, "id");
				var hide = false;
				var widget_options = {};
				if(index_name) {
					if(selected == index_name) this.selected_index = i;
					if(hidden[index_name]) {
						hide = true;
					}
					// Get the class attribute and add it as widget_options
					var classAttr = et2_readAttrWithDefault(node,"class");
					if (classAttr)
					{
						widget_options = {'class':classAttr};
					}
				}
				tabData.push({
					"id": index_name,
					"label": this.egw().lang(et2_readAttrWithDefault(node, "label", "Tab")),
					"widget": null,
					"widget_options": widget_options,
					"contentDiv": null,
					"flagDiv": null,
					"hidden": hide,
					"XMLNode": null,
					"promise": null
				});
			}
			else
			{
				throw("Error while parsing: Invalid tag '" + nodeName +
					"' in tabs tag");
			}
			i++;
		}, this);

		// Make sure we don't try to display a hidden tab
		for(var i = 0; i < tabData.length && this.selected_index === false; i++)
		{
			if(!tabData[i].hidden) this.selected_index = i;
		}
	},

	_readTabPanels: function(tabData, tabpanels) {
		var i = 0;
		et2_filteredNodeIterator(tabpanels, function(node, nodeName) {
			if (i < tabData.length)
			{
				// Store node for later evaluation
				tabData[i].XMLNode = node;
			}
			else
			{
				throw("Error while reading tabpanels tag, too many widgets!");
			}
			i++;
		}, this);
	},

	loadFromXML: function(_node) {
		// Get the tabs and tabpanels tags
		var tabsElems = et2_directChildrenByTagName(_node, "tabs");
		var tabpanelsElems = et2_directChildrenByTagName(_node, "tabpanels");
		var tabData = [];

		// Check for a parent height, we'll apply it to tab panels
		var height = et2_readAttrWithDefault(_node.parentNode, "height",null);
		if(height)
		{
			this.tabContainer.css("height", height);
		}

		// if no tabs set or they should be added to tabs from xml
		if (!this.options.tabs || this.options.add_tabs)
		{
			if (tabsElems.length == 1 && tabpanelsElems.length == 1)
			{
				var tabs = tabsElems[0];
				var tabpanels = tabpanelsElems[0];

				// Parse the "tabs" tag
				this._readTabs(tabData, tabs);

				// Read and create the widgets defined in the "tabpanels"
				this._readTabPanels(tabData, tabpanels);
			}
			else
			{
				this.egw().debug("error","Error while parsing tabbox, none or multiple tabs or tabpanels tags!",this);
			}
		}
		if (this.options.tabs)
		{
			var readonly = this.getArrayMgr("readonlys").getEntry(this.id) || {};
			for(var i = 0; i < this.options.tabs.length; i++)
			{
				var tab = this.options.tabs[i];
				var tab_id = tab.id || tab.template;
				var tab_options = {id: tab_id, template:tab.template, url: tab.url};
				if(tab.id)
				{
					tab_options.content = tab.id;
				}
				tabData[tab.prepend ? 'unshift' : 'push'].call(tabData, {
					"id": tab.id,
					"label": this.egw().lang(tab.label),
					"widget": null,
					"widget_options": tab_options,
					"contentDiv": null,
					"flagDiv": null,
					"hidden": typeof tab.hidden != "undefined" ? tab.hidden : readonly[tab_id] || false,
					"XMLNode": null,
					"promise": null
				});
			}
		}

		// Create the tab DOM-Nodes
		this.createTabs(tabData);
	},

	/**
	 * Load is finished, set up tabs to load on their own
	 */
	doLoadingFinished: function()
	{
		var tab_deferred = jQuery.Deferred();
		var promises = [];
		var tabs = this;

		// Specially process the selected index so it shows up right away
		this._loadTab(this.selected_index,promises);

		// Apply parent now, which actually puts into the DOM
		// This has to be before loading the child, so the dom sub-tree is not
		// disconnected, which causes problems for things like CKEditor
		this._super.apply(this, arguments);

		// We can do this and not wind up with 2 because child is a template,
		// which has special handling
		this._children[0].loadingFinished(promises);

		// Defer parsing & loading of other tabs until later
		window.setTimeout(function() {
			for (var i = 0; i < tabs.tabData.length; i++)
			{
				if (i == tabs.selected_index) continue;
				tabs._loadTab(i,promises);
			}
			jQuery.when.apply(jQuery,promises).then(function() {
				tab_deferred.resolve();
			});
		},0);

		return tab_deferred.promise();
	},

	/**
	 * Load & render a tab's content
	 *
	 * @param {number} index numerical index of tab in this.tabData array
	 * @param {array} promises
	 */
	_loadTab: function(index,promises) {
		var tabData = this.tabData[index];
		if(!tabData || tabData.loaded) return;
		if(tabData.XMLNode != null)
		{
			if(tabData.hidden)
			{
				// Set hidden tab to readonly, so widgets aren't active
				// Do not modify the XMLNode, or the change will be cached for all
				tabData.XMLNode = tabData.XMLNode.cloneNode();
				tabData.XMLNode.setAttribute('readonly', true);
			}
			tabData.widget = this.createElementFromNode(tabData.XMLNode,tabData.XMLNode.nodeName.toLowerCase());

			// Release the XML node
			tabData.XMLNode = null;
		}
		else if (tabData.widget_options)
		{
			tabData.widget = et2_createWidget('template',tabData.widget_options,this);
		}

		// Set loaded flag to not do this again, even if not fully done
		tabData.loaded = true;

		// loadingFinished() will be called either when the promise from doLoadingFinished is resolved,
		// or during the normal execution
	},

	/**
	 * Check for custom tabs
	 *
	 * @param {object} _attrs
	 */
	transformAttributes: function(_attrs) {
		this._super.apply(this, arguments);

		// Add in settings that are objects
		var data = this.getArrayMgr("modifications").getEntry(this.id);
		for(var key in data)
		{
			if(typeof data[key] === 'object' && ! _attrs[key]) _attrs[key] = data[key];
		}
	},

	createTabs: function(tabData) {
		this.tabData = tabData;

		this.tabContainer.empty();
		this.flagContainer.empty();

		for (var i = 0; i < this.tabData.length; i++)
		{
			var entry = this.tabData[i];
			entry.flagDiv = jQuery(document.createElement("span"))
				.addClass("et2_tabflag")
				.appendTo(this.flagContainer);
			// Class to tab's div container
			if (entry.widget_options && typeof entry.widget_options.class != 'undefined')
			{
				entry.flagDiv.addClass(entry.widget_options.class);
			}
			entry.flagDiv.text(entry.label || "Tab");
			if(entry.hidden)
			{
				entry.flagDiv.hide();
			}
			else
			{
				entry.flagDiv.click({"tabs": this, "idx": i}, function(e) {
					e.data.tabs.setActiveTab(e.data.idx);
				});
			}
			entry.contentDiv = jQuery(document.createElement("div"))
				.addClass("et2_tabcntr")
				.appendTo(this.tabContainer);
			if (this.options.align_tabs == 'v') {
				entry.flagDiv.unbind('click');
				entry.flagDiv.text("");
				jQuery(document.createElement('div'))
						.addClass('et2_tabtitle')
						.text(entry.label || "Tab")
						.click({"tabs": this, "idx": i}, function(e) {
							e.data.tabs.flagContainer.children(":eq(" + e.data.idx + ")").toggleClass('active');
							if (e.data.tabs.selected_index != e.data.idx) e.data.tabs.setActiveTab(e.data.idx);
						})
						.appendTo(entry.flagDiv);
				entry.contentDiv.appendTo(entry.flagDiv);
			}
		}

		if (this.options.align_tabs == 'v'){

			this.container.addClass('vertical');
			this.tabContainer.hide();
		}
		// Check for a passed in value
		if(this.options.value)
		{
			this.selected_index = 0;
			for(var i = 0; i < this.tabData.length; i++)
			{
				if(this.tabData[i].id == this.options.value)
				{
					this.selected_index = i;
					break;
				}
			}
		}

		this.setActiveTab(this.selected_index);
	},

	/**
	 * Gets the index of the currently active tab
	 *
	 * @returns {number}
	 */
	get_active_tab: function() {
		return this.selected_index;
	},

	/**
	 * Sets the currently active tab by index
	 *
	 * @param {number} _idx
	 */
	setActiveTab: function(_idx) {
		this.selected_index = _idx;

		// Remove the "active" flag from all tabs-flags
		jQuery(".et2_tabflag", this.flagContainer).removeClass("active");

		// Hide all tab containers
		this.tabContainer.children().hide();

		// Set the tab flag with the given index active and show the corresponding
		// container
		this.flagContainer.children(":eq(" + _idx + ")").addClass("active");
		this.tabContainer.children(":eq(" + _idx + ")").show();
	},

	/**
	 * Activate the tab containing the given widget
	 *
	 * @param {et2_widget} widget
	 * @return {bool} widget was found in a tab
	 */
	activateTab: function(widget) {
		var tab = widget;
		while(tab._parent && tab._parent._type !='tabbox')
		{
			tab = tab._parent;
		}

		var child_index = this._children.indexOf(tab);
		for(var i = 0; i < this.tabData.length; i++)
		{
			if(this.tabData[i].widget == tab)
			{
				this.setActiveTab(i);
				return true;
			}
		}
		return false;
	},

	getDOMNode: function(_sender) {
		if (_sender == this)
		{
			return this.container[0];
		}
		else
		{
			for (var i = 0; i < this.tabData.length; i++)
			{
				if (this.tabData[i].widget == _sender)
				{
					return this.tabData[i].contentDiv[0];
				}
			}

			return null;
		}
	},

	set_tab_height: function (_height)
	{
		this.tab_height = _height;
		this.tabContainer.css("height", _height);
	},

	set_height: function(_value) {
		this.height = _value;

		this.tabContainer.css("height", _value);
	},

	/**
	 * getValue has to return the value of the input widget
	 */
	getValue: function() {
		return this.tabData[this.selected_index].id;
	},

	/**
	 * Is dirty returns true if the value of the widget has changed since it
	 * was loaded.
	 */
	isDirty: function() {
		return this.selected_index != this.value;
	},

	/**
	 * Causes the dirty flag to be reseted.
	 */
	resetDirty: function()
	{
		this.value = this.selected_index;
	},
	isValid: function(messages) {
		return true;
	},

	resize: function (_height)
	{
		if(_height)
		{
			this.set_height(this.tabContainer.height() + _height);
		}
		//Set the height of tabs with the heighest height
		else if(_height === 0)
		{
			this.set_height(this.tabContainer.height());
		}
	}
});}).call(this);
et2_register_widget(et2_tabbox, ["tabbox"]);
