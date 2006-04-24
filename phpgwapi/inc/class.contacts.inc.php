<?php
/**************************************************************************\
* eGroupWare - contacts service provided by the addressbook application    *
* http://www.egroupware.org                                                *
* Written and (c) 2006 Ralf Becker <RalfBecker-AT-outdoor-training.de>     *
* ------------------------------------------------------------------------ *
*  This program is free software; you can redistribute it and/or modify it *
*  under the terms of the GNU General Public License as published by the   *
*  Free Software Foundation; either version 2 of the License, or (at your  *
*  option) any later version.                                              *
\**************************************************************************/

/* $Id$ */

require_once(EGW_INCLUDE_ROOT.'/addressbook/inc/class.bocontacts.inc.php');

/**
 * contacts service provided by the addressbook application
 *
 * @package api
 * @author Ralf Becker <RalfBecker-AT-outdoor-training.de>
 * @copyright (c) 2006 by Ralf Becker <RalfBecker-AT-outdoor-training.de>
 * @license http://opensource.org/licenses/gpl-license.php GPL - GNU General Public License
 */
class contacts extends bocontacts
{
	/**
	 * @deprecated since 1.3 use total
	 * @var int $total_records
	 */
	var $total_records;

	function contacts($contact_app='addressbook')
	{
		$this->bocontacts($contact_app);
		
		$this->total_records =& $this->total;
	}
	
	/**
	* reads contacts matched by key and puts all cols in the data array
	*
	* @param int/string $contact_id 
	* @return array/boolean contact data or false on error
	*/
	function read($contact_id)
	{
		if (func_num_args() > 1)	// calling the old / depricated read function
		{
			$args = func_get_args();
			return call_user_func_array(array(&$this,'old_read'),$args);
		}
		return parent::read($contact_id);
	}

	/**
	 * searches db for rows matching searchcriteria
	 *
	 * '*' and '?' are replaced with sql-wildcards '%' and '_'
	 *
	 * @param array/string $criteria array of key and data cols, OR a SQL query (content for WHERE), fully quoted (!)
	 * @param boolean/string $only_keys=true True returns only keys, False returns all cols. comma seperated list of keys to return
	 * @param string $order_by='' fieldnames + {ASC|DESC} separated by colons ',', can also contain a GROUP BY (if it contains ORDER BY)
	 * @param string/array $extra_cols='' string or array of strings to be added to the SELECT, eg. "count(*) as num"
	 * @param string $wildcard='' appended befor and after each criteria
	 * @param boolean $empty=false False=empty criteria are ignored in query, True=empty have to be empty in row
	 * @param string $op='AND' defaults to 'AND', can be set to 'OR' too, then criteria's are OR'ed together
	 * @param mixed $start=false if != false, return only maxmatch rows begining with start, or array($start,$num)
	 * @param array $filter=null if set (!=null) col-data pairs, to be and-ed (!) into the query without wildcards
	 * @return array of matching rows (the row is an array of the cols) or False
	 */
/*	function &search($criteria,$only_keys=True,$order_by='',$extra_cols='',$wildcard='',$empty=False,$op='AND',$start=false,$filter=null)
	{
		//echo "<p>contacts::search(".print_r($criteria,true).",'$only_keys','$order_by','$extra_cols','$wildcard','$empty','$op','$start')</p>\n";
		return parent::regular_search($criteria,$only_keys,$order_by,$extra_cols,$wildcard,$empty,$op,$start,$filter);
	}*/

	/**
	 * Deprecated methods and class vars for compatibility with the old contacts class
	 *
	 * They will be removed after one release, so dont use them in new code!!!
	 */
	
	/**
	 * Searches for contacts meating certain criteria and evtl. return only a range of them
	 *
	 * This method was named read in eGW 1.0 and 1.2
	 *
	 * @deprecated since 1.3 use search() instead
	 * @param int $start=0 starting number of the range, if $limit != 0
	 * @param int $limit=0 max. number of entries to return, 0=all
	 * @param array $fields=null fields to return or null for all stock fields
	 * @param string $query='' search pattern or '' for none
	 * @param string $filter='' filters with syntax like <name>=<value>,<name2>=<value2>,<name3>=!'' for not empty
	 * @param string $sort='' sorting: ASC or DESC
	 * @param string $order='' column to order, default ('') n_family,n_given,email ASC
	 * @param int $lastmod=-1 return only values modified after given timestamp, default (-1) return all
	 * @param string $cquery='' return only entries starting with given character, default ('') all
	 * @return array of contacts
	 */
	function old_read($start=0,$limit=0,$fields=null,$query='',$filter='',$sort='',$order='', $lastmod=-1,$cquery='')
	{
		//echo "<p>contacts::old_read($start,$limit,".print_r($fields,true).",$query,'$filter','$sort','$order',$lastmod,$cquery)</p>\n";
		$criteria = $sfilter = array();
		if ($cquery) $query = $cquery.'*';
		if ($query)
		{
			foreach(array_merge($this->columns_to_search,$this->account_extra_search) as $col)
			{
				$criteria[$col] = $query['search'];
			}
		}
		foreach(explode(',',$filter) as $expr)
		{
			list($col,$value) = explode('=',$expr);
			
			$sfilter[$col] = $value;
		}
		if ($lastmod != -1)
		{
			$sfilter[] = 'contact_modified > '.(int)$lastmod;
		}
		if ($order && !strstr($order,'_')) $order = 'contact_'.$order;
		if (!$order) $order = 'org_name';
		
		if (is_array($fields))
		{
			$fields = array_values($fields);
		}
		//echo '<p>contacts::search('.print_r($criteria,true).','.print_r($fields,true).",'$order $sort','','$wildcard',false,'OR',".(!$limit ? 'false' : "array($start,$limit)").",".print_r($sfilter,true).");</p>\n";
		$rows =& $this->search($criteria,$fields,$order.($sort ? ' '.$sort : ''),'',$wildcard,false,'OR',
			!$limit ? false : array((int)$start,(int)$limit),$sfilter);
			
		// fix the old birthday format
		if ($rows && in_array('bday',$fields))
		{
			foreach($rows as $n => $row)
			{
				list($y,$m,$d) = explode('-',$row['bday']);
				$rows[$n]['bday'] = sprintf('%d/%d/%04d',$m,$d,$y);
			}
		}
		return $rows;
	}

	/**
	 * read a single entry
	 *
	 * @deprecated since 1.3 use read() instead
	 * @param int $id
	 * @param string $fields='' we always return all fields now
	 * @return array/boolean contact or false on failure
	 */
	function read_single_entry($id,$fields='')
	{
		return $this->read($id);
	}
	
	/**
	 * add a contact
	 *
	 * @deprecated since 1.3 use save() instead
	 * @param int $owner owner of the entry
	 * @param array $fields contains access, cat_id and tif if their param is null
	 * @param string $access=null 'private' or 'public'
	 * @param int $cat_id=null
	 * @param string $tid=null 'n'
	 * @return array/boolean contact or false on failure
	 */
	function add($owner,$fields,$access=NULL,$cat_id=NULL,$tid=NULL)
	{
		// access, cat_id and tid can be in $fields now or as extra params
		foreach(array('access','cat_id','tid') as $extra)
		{
			if (!is_null($$extra))
			{
				$fields[$extra] = $$extra;
			}
		}
		if(empty($fields['tid']))
		{
			$fields['tid'] = 'n';
		}
		$fields['private'] = (int) $fields['access'] == 'private';
		unset($fields['id']);	// in case it's set

		return !$this->save($fields) ? $fields['id'] : false;
	}

	/**
	 * update a contact
	 *
	 * @deprecated since 1.3 use save() instead
	 * @param int $id id of the entry
	 * @param int $owner owner of the entry
	 * @param array $fields contains access, cat_id and tif if their param is null
	 * @param string $access=null 'private' or 'public'
	 * @param int $cat_id=null
	 * @param string $tid=null 'n'
	 * @return array/boolean contact or false on failure
	 */
	function update($id,$owner,$fields,$access=NULL,$cat_id=NULL,$tid=NULL)
	{
		// access, cat_id and tid can be in $fields now or as extra params
		foreach(array('access','cat_id','tid') as $extra)
		{
			if (!is_null($$extra))
			{
				$fields[$extra] = $$extra;
			}
		}
		if(empty($fields['tid']))
		{
			$fields['tid'] = 'n';
		}
		$fields['private'] = (int) $fields['access'] == 'private';
		$fields['id'] = $id;

		return $id && !$this->save($fields);
	}
}
