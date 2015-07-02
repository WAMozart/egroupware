<?php
	/**************************************************************************\
	* eGroupWare - Administration                                              *
	* http://www.egroupware.org                                                *
	* --------------------------------------------                             *
	*  This program is free software; you can redistribute it and/or modify it *
	*  under the terms of the GNU General Public License as published by the   *
	*  Free Software Foundation; either version 2 of the License, or (at your  *
	*  option) any later version.                                              *
	\**************************************************************************/

	/* $Id$ */

	class uimenuclass
	{
		var $t;
		var $rowColor = Array();

		function uimenuclass()
		{
			$this->t =& CreateObject('phpgwapi.Template',$GLOBALS['egw']->common->get_tpl_dir('admin'));

			$this->t->set_file(array('menurow' => 'menurow.tpl'));
			$this->t->set_block('menurow','menu_links','menu_links');
			$this->t->set_block('menurow','link_row','link_row');

			$this->rowColor[0] = $GLOBALS['egw_info']['theme']['row_on'];
			$this->rowColor[1] = $GLOBALS['egw_info']['theme']['row_off'];
		}

		function section_item($pref_link='',$pref_text='', $class='',$options='')
		{
			$this->t->set_var('row_link',$pref_link);
			$this->t->set_var('row_text',$pref_text);
			$this->t->set_var('class',$class);
			$this->t->set_var('row_options',$options);
			$this->t->parse('all_rows','link_row',True);
		}

		// $file must be in the following format:
		// $file = array(
		//  'Login History' => array('/index.php','menuaction=admin.uiaccess_history.list')
		// );
		// This allows extra data to be sent along
		function display_section($_menuData, $_account_id)
		{
			$i=0;

			// reset the value of all_rows
			$this->t->set_var('all_rows','');

			while(list($key,$value) = each($_menuData))
			{
				if (!empty($value['extradata']))
				{
					$link = egw::link($value['url'],'account_id=' . $_account_id . '&' . $value['extradata']);
				}
				else
				{
					$link = egw::link($value['url'],'account_id=' . get_var('account_id',array('GET','POST')));
				}
				$this->section_item($link,lang($value['description']),($i%2) ? "row_on": "row_off",$value['options']);
				$i++;
			}

			if(strpos($_menuData[0]['extradata'],'user'))
			{
				$destination = 'users';
			}
			else
			{
				$destination = 'groups';
			}
			$this->t->set_var('link_done',$GLOBALS['egw']->link('/index.php','menuaction=admin.uiaccounts.list_'.$destination));
			$this->t->set_var('lang_done',lang('Back'));

			$this->t->set_var('row_on',$this->rowColor[0]);

			$this->t->parse('out','menu_links');

			return $this->t->get('out','menu_links');
		}

		// create the html code for the menu
		function createHTMLCode($_hookname, $_account_id=null)
		{
			$hook = array('location' => $_hookname);
			if (!$_account_id) $_account_id = get_var('account_id',array('GET','POST'));
			if ($_account_id) $hook['account_id'] = $_account_id;

			switch ($_hookname)
			{
				case 'edit_user':
					$GLOBALS['menuData'][] = array(
						'description' => 'User Data',
						'url'         => '/index.php',
						'extradata'   => 'menuaction=admin.uiaccounts.edit_user'
					);
					break;
				case 'view_user':
					$GLOBALS['menuData'][] = array(
						'description' => 'User Data',
						'url'         => '/index.php',
						'extradata'   => 'menuaction=admin.uiaccounts.view_user'
					);
					break;
				case 'edit_group':
					$GLOBALS['menuData'][] = array(
						'description' => 'Edit Group',
						'url'         => '/index.php',
						'extradata'   => 'menuaction=admin.uiaccounts.edit_group'
					);
					break;
				case 'group_manager':
					$GLOBALS['menuData'][] = array(
						'description' => 'Group Manager',
						'url'         => '/index.php',
						'extradata'   => 'menuaction=admin.uiaccounts.group_manager'
					);
					break;
			}
			//_debug_array($hook);
			$GLOBALS['egw']->hooks->process($hook);
			if (count($GLOBALS['menuData']) >= 1)
			{
				$result = $this->display_section($GLOBALS['menuData'], $_account_id);
				//clear $menuData
				$GLOBALS['menuData'] = '';
				return $result;
			}
			else
			{
				// clear $menuData
				$GLOBALS['menuData'] = '';
				return '';
			}
		}
	}