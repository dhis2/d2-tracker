"use strict";

/*
 * Copyright (c) 2004-2014, University of Oslo
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * * Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * * Neither the name of the HISP project nor the names of its contributors may
 *   be used to endorse or promote products derived from this software without
 *   specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

dhis2.util.namespace('dhis2.tracker');

dhis2.tracker.chunk = function( array, size ){
	if( !array.length || !size || size < 1 ){
		return []
	}
	
	var groups = [];
	var chunks = array.length / size;
	for (var i = 0, j = 0; i < chunks; i++, j += size) {
        groups[i] = array.slice(j, j + size);
    }
	
    return groups;
}

dhis2.tracker.getTrackerMetaObjects = function( programs, objNames, url, requestData )
{
    if( !programs || !programs.programIds || programs.programIds.length === 0 ){
        return;
    }       

    requestData.filter = requestData.filter + '[' + programs.programIds.toString() + ']';
    
    
    return $.ajax(
        {
            url: url,
            type: 'GET',
            data:requestData
        })
        .then( function(response) {
            return {programs: programs, self: response[objNames], programIds: programs.programIds};
        }, function(){
            return null;
        }); 
};

dhis2.tracker.getTrackerObjects = function( store, objs, url, requestData, storage, db )
{

    return $.ajax(
        {
            url: url,
            type: 'GET',
            data: requestData
        })
        .then(function(response) {
            if(response[objs]){
                if(storage === 'idb'){
                    db.setAll( store, response[objs] );                
                }
                if(storage === 'localStorage'){                
                    localStorage[store] = JSON.stringify(response[objs]);
                }            
                if(storage === 'sessionStorage'){
                    var SessionStorageService = angular.element('body').injector().get('SessionStorageService');
                    SessionStorageService.set(store, response[objs]);
                }
                if(storage === 'temp'){
                    return response[objs] || [];
                }
            }
        });
};

dhis2.tracker.getTrackerObject = function( id, store, url, requestData, storage, db )
{
    
    if(id){
        url = url + '/' + id + '.json';
    }
        
    return $.ajax(
        {
            url: url,
            type: 'GET',            
            data: requestData
        })
        .then( function( response ){
            if(storage === 'idb'){
                if( response && response.id) {
                    db.set( store, response );
                }
            }
            if(storage === 'localStorage'){
                localStorage[store] = JSON.stringify(response);
            }            
            if(storage === 'sessionStorage'){
                var SessionStorageService = angular.element('body').injector().get('SessionStorageService');
                SessionStorageService.set(store, response);
            }
    });
};

dhis2.tracker.getBatches = function( ids, batchSize, data, store, objs, url, requestData, storage, db )
{
    if( !ids || !ids.length || ids.length < 1){
        
        return data;
    }
    
    var batches = dhis2.tracker.chunk( ids, batchSize );

    var promises = batches.map(function(batch) { return dhis2.tracker.fetchBatchItems(batch,store, objs, url, requestData, storage,db) });

    return $.when.apply($, promises).then(function(){
        return data;
    });
};

dhis2.tracker.fetchBatchItems = function( batch, store, objs, url, requestData, storage, db )
{
    var ids = '[' + batch.toString() + ']';             
    requestData.filter = 'id:in:' + ids;    
    return dhis2.tracker.getTrackerObjects( store, objs, url, requestData, storage, db );    
};