sap.ui.define([
    "sap/ui/model/odata/v2/ODataModel"
], function (ODataModel) {
    "use strict";
    
    return {

        _oPromises: {},
        _oComponent: null,

        init: function(oComponent) {
            this._oComponent = oComponent;
        
            <% if(existingConnections) { %>
                <% existingConnections.forEach(connection => { %>

                const <%=connection.oModelName%>Model = new ODataModel("<%= connection.gatewayPath %>", {
                    defaultUpdateMethod: "PUT" // Change to PATCH if necessary
                });
                this.setODataModel(oDataModel, "<%= connection.oModelName%>");
            <% }) %>

            <% } else { %>
                const oDataModel = new ODataModel("/example-gateway-path", {
                    defaultUpdateMethod: "PUT" // Change to PATCH if necessary
                });

            this.setODataModel(oDataModel, "<oDataModelName>"); //Datasource is default
            
            <% } %>
        },

        getOwnerComponent: function() {
            return this._oComponent;
        },

        getPromise: function(...aModelNames) {
            const aPromises = aModelNames.map(sModelName => {
                return this._oPromises[sModelName];
            });
            
            return Promise.all(aPromises);
        },

        setODataModel: function(oModel, sName) {
            const oComponent = this.getOwnerComponent();
            oComponent.setModel(oModel, sName);

            const pMetadata = new Promise((resolve, reject) => {
                oModel.attachEventOnce("metadataLoaded", resolve);
                oModel.attachEventOnce("metadataFailed", reject);
            });

            this._oPromises[sName] = pMetadata;
        },

        read: function(sModelName, sPath, options) {
            const oComponent = this.getOwnerComponent();
            const oModel = oComponent.getModel(sModelName);

			return new Promise((resolve, reject) => {
                return this._oPromises[sModelName].then(() => {
                    if (!options) {
                        options = {};
                    }
    
                    options = {
                        ...options,
                        success: (oData, response) => resolve({oData, response}),
                        error: oError => reject(oError)
                    };
    
                    oModel.read(sPath, options);
                });
			});
		},

        remove: function(sModelName, sPath, options) {
            const oComponent = this.getOwnerComponent();
            const oModel = oComponent.getModel(sModelName);

			return new Promise((resolve, reject) => {
                return this._oPromises[sModelName].then(() => {
                    if (!options) {
                        options = {};
                    }
    
                    options = {
                        ...options,
                        success: (oData, response) => resolve({oData, response}),
                        error: oError => reject(oError)
                    };
    
                    oModel.remove(sPath, options);
                });
			});
		},

        create: function(sModelName, sPath, oData, options) {
            const oComponent = this.getOwnerComponent();
            const oModel = oComponent.getModel(sModelName);

			return new Promise((resolve, reject) => {
                return this._oPromises[sModelName].then(() => {
                    if (!options) {
                        options = {};
                    }
    
                    options = {
                        ...options,
                        success: (oData, response) => resolve({oData, response}),
                        error: oError => reject(oError)
                    };
    
                    oModel.create(sPath, oData, options);
                });
			});
		},

        update: function(sModelName, sPath, oData, options) {
            const oComponent = this.getOwnerComponent();
            const oModel = oComponent.getModel(sModelName);

			return new Promise((resolve, reject) => {
                return this._oPromises[sModelName].then(() => {
                    if (!options) {
                        options = {};
                    }
    
                    options = {
                        ...options,
                        success: (oData, response) => resolve({oData, response}),
                        error: oError => reject(oError)
                    };
    
                    oModel.update(sPath, oData, options);
                });
			});
		}

    };
});