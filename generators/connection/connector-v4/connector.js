// @ts-nocheck

sap.ui.define([
    "sap/ui/model/odata/v4/ODataModel",
  ],
  function (ODataModel) {
    "use strict";
    <% if(wantDocs) {%>
      /**
       * Parâmetros de URL do UI5, {@link https://www.odata.org/getting-started/basic-tutorial/ Informações}
       * @typedef {Object} mParameters
       * @property {strin=} [$expand] - Especifica os relacionamentos a serem expandidos.
       * @property {string} [$filter] - Filtra todos os dados por alguma query, olhe o link dos params. 
       * @property {string} [$orderby] - Ordena os resultados.
       * @property {string} [$select] - Seleciona as propriedades.
       * @property {'$auto'|'$auto.*'|'$direct'} [$$groupId] - Define do GroupId da operação.
       * @property {'$auto'|'$auto.*'|'$direct'} [$$updateGroupId] - Atualize o groupId para essa operação.
       * @property {boolean} [$$canonicalPath] - Determina se um caminho canônico deve ser usado para a solicitação (chatGPT translate).
       * @property {boolean} [$$inheritExpandSelect] - Herda o expand e select anteriormente selecionado no contexto pai.
       * @property {boolean} [$$ownRequest] - Força uma request separada para essa chamada.
       * @property {boolean} [$count] - Conta o total de dados encontrados, não se limita ao limite da requisição.
      */
    <% } %> 
    return {
      _defaultFilter: function(sID) {
        return {
          $filter: `ID eq ${sID}`
        }
      },
      init: function (oComponent) {
        this._oComponent = oComponent
      },
      <% if(wantDocs) {%>
        /** 
         * @method getOwnerComponent
         * @private
         * @returns {sap.ui.core.Component} - Componente do UI5
        */
       <% } %>
      getOwnerComponent: function () {
        return this._oComponent
      },
      <% if(wantDocs) {%>
        /** 
         * @method getODataModel
         * @private
         * @param {String} sModelName - Representa o nome da Model
         * @returns {sap.ui.model.odata.v4.ODataModel} - Representa a oData Model
        */
      <% } %>
       getODataModel: function (sModelName) {
        const oDataModel = this.getOwnerComponent().getModel(sModelName)
        return oDataModel
      },
      <% if(wantDocs) {%>
        /** 
         * @method getODataModel
         * @param {string} sModelName - Nome da model dentro da manifest
         * @param {string} sPath - Caminho da requisição
         * @param {mParameters=} oURLParams - Parâmetros adicionais de URL.
         * @param {sap.ui.model.odata.v4.Context=} oContext - Contexto do componente UI5
         * @param {sap.ui.model.Filter=} oFilter - Filtro do próprio UI5
         * @param {sap.ui.model.Sorter=} oSort - Sort do próprio UI5
         * @returns {sap.ui.model.odata.v4.ODataListBinding} - Representa o listBinding -> Context
        */
       <% } %>
      _oDataBindingList: function(sModelName, sPath, oContext, oURLParams, oFilter, oSort){
        return this.getODataModel(sModelName).bindList(sPath, oContext, oSort, [oFilter], oURLParams);
      },
      <% if(wantDocs) {%>
        /** 
         * Read mais performático, porém não possui suporte para Filter e Sort do próprio UI5.
         * @callback read
         * @param {object} data - dados para requisição
         * @param {string} data.sModelName - Nome da model dentro da manifest
         * @param {string} data.sPath - Caminho da requisição
         * @param {mParameters=} data.oURLParams - Parâmetros adicionais de URL.
         * @param {sap.ui.model.odata.v4.Context=} data.oContext - Contexto do componente UI5
         * @returns {Promise<any>} Resposta com os dados da requisição feita
        */
       <% } %>
      read: async function ({sModelName, sPath, oURLParams, oContext}) {
        const oODataModel = this.getODataModel(sModelName);
        
        const oDataContext = oODataModel.bindContext(sPath, oContext, oURLParams)
        const oResponse = await oDataContext.requestObject()
        const aData = oResponse.value || oResponse
    
        return aData
      }, 
      <% if(wantDocs) {%>
        /** 
         * Read menos performático, porém possui suporte para Filter e Sort do próprio UI5.
         * @callback readListBinding
         * @param {object} data - dados para requisição
         * @param {string} data.sModelName - Nome da model dentro da manifest
         * @param {string} data.sPath - Caminho da requisição
         * @param {mParameters=} data.oURLParams - Parâmetros adicionais de URL.
         * @param {sap.ui.model.odata.v4.Context=} data.oContext - Contexto do componente UI5
         * @param {sap.ui.model.Filter=} data.oFilter - Filtro do próprio UI5
         * @param {sap.ui.model.Sorter=} data.oSort - Sort do próprio UI5
         * @returns {Promise<array>} Resposta com os dados da requisição feita
        */
       <% } %>
      readListBinding: async function ({sModelName, sPath, oURLParams, oContext, oFilter, oSort}) {
        // Somente funciona com Filtros Padrão do FilterOperator
        const oDataBindList = this._oDataBindingList(sModelName, sPath, oContext, oURLParams, oFilter, oSort)
        const aContexts = await oDataBindList.requestContexts()
        const aData = Promise.all(aContexts.map((promise) => promise.requestObject()))
        
        return aData
      }, 
      <% if(wantDocs) {%>
        /** 
         * Create.
         * @callback create
         * @param {object} data - dados para requisição
         * @param {string} data.sModelName - Nome da model dentro da manifest
         * @param {object} data.oData - Dados a serem criados
         * @param {string} data.sPath - Caminho da requisição
         * @param {sap.ui.model.odata.v4.Context=} data.oContext - Contexto do componente UI5
         * @param {boolean} [data.bSkipRefresh=false]
         * @returns {Promise<object>} A entidade criada
        */
       <% } %>
      create: async function ({sModelName, oData, sPath, oContext, bSkipRefresh = false}) {
        const oDataBindList = this._oDataBindingList(sModelName, sPath, oContext);
        const oEntity = oDataBindList.create(oData, bSkipRefresh)
        
        await new Promise(async (resolve, reject) => {
            oDataBindList.attachCreateCompleted((oEvent) => { 
                const { success } = oEvent.getParameters();
              
                if (!success) {
                  const aBatchMessages = oDataBindList.getModel().mMessages[""]
                  
                  const aBatchMessagesClone = [...aBatchMessages].reverse()
                  const hasBatchError = aBatchMessagesClone?.find(res => res.message !== '' && (res.code >= 400 || res.getTechnicalDetails().httpStatus >= 400)); 
    
                if(hasBatchError){ 
                  reject(hasBatchError)
                }
            }
    
          resolve()
        })
      })
    
        return oEntity
      },
      <% if(wantDocs) {%>
        /** 
         * Update.
         * @callback update
         * @param {object} data - dados para requisição
      * @param {string} data.sModelName - Nome da model dentro da manifest
      * @param {object} data.oChangedData - Dados a serem atualizados
      * @param {string} data.sPath - Caminho da requisição
      * @param {string=} data.sID - ID do elemento que desejamos DELETAR
      * @param {mParameters=} data.oURLParams - Parâmetros adicionais de URL.
      * @param {sap.ui.model.odata.v4.Context=} data.oContext - Contexto do componente UI5
      * @param {sap.ui.model.Filter=} data.oFilter - Filtro do próprio UI5
      * @param {sap.ui.model.Sorter=} data.oSort - Sort do próprio UI5
      * @returns {Promise<object>} a Entidade Editada
        */
     <% } %>
      update: async function({sModelName, oChangedData, sPath, sID, oContext, oURLParams, oFilter, oSort}){
        const oSettings = !sID ? oURLParams : this._defaultFilter(sID) 
    
        const oDataBindList = this._oDataBindingList(sModelName, sPath, oContext, oSettings, oFilter, oSort);
        
          const [ oDataContext ] = await oDataBindList.requestContexts()

          const aChangedDataPromises = Object.entries(oChangedData).map(([key, value]) => {
            return oDataContext.setProperty(key, value);
          })

          await Promise.all(aChangedDataPromises)

          const oEntity = await oDataContext.requestObject()

          return oEntity
      },
      <% if(wantDocs) {%>
        /** 
         * UpdateMany, quando quiser atualizar +1 dado sem necessariamente enviar um ID, ex: emails com final @lab2dev.com.
         * @callback updateMany
         * @param {object} data - dados para requisição
         * @param {string} data.sModelName - Nome da model dentro da manifest
         * @param {object} data.oChangedData - Dados a serem atualizados
         * @param {string} data.sPath - Caminho da requisição
         * @param {mParameters=} data.oURLParams - Parâmetros adicionais de URL.
        * @param {sap.ui.model.odata.v4.Context=} data.oContext - Contexto do componente UI5
        * @param {sap.ui.model.Filter=} data.oFilter - Filtro do próprio UI5
        * @param {sap.ui.model.Sorter=} data.oSort - Sort do próprio UI5
        * @returns {Promise<object>} a Entidade Editada
        */
       <% } %> 
      updateMany: async function({sModelName, oChangedData, sPath, oContext, oURLParams, oFilter, oSort}){
        // Not tested yet
        const oDataBindList = this._oDataBindingList(sModelName, sPath, oContext, oURLParams, oFilter, oSort);
        
        const aContexts = await oDataBindList.requestContexts()
    
        const aChangedDataPromises = aContexts.map(oDataContext => {
            return Object.entries(oChangedData).map(([key, value]) => {
              return oDataContext.setProperty(key, value);
            })
        })
    
        await Promise.all(aChangedDataPromises)
    
        const aEntities = await aContexts.map(oDataContext => {
          return oDataContext.requestObject()
        })
    
        return aEntities
      },
      <% if(wantDocs) {%>
        /** 
         * Delete.
         * @callback delete
         * @param {object} data - dados para requisição
         * @param {string} data.sModelName - Nome da model dentro da manifest
         * @param {string} data.sPath - Caminho da requisição
         * @param {sap.ui.model.odata.v4.Context=} data.oContext - Contexto do componente UI5
         * @param {string} data.sID - ID do elemento que desejamos DELETAR
         * @returns {Promise<void>} Somente uma promise se foi Apagado com sucesso!
        */
       <% } %>
       delete: async function({sModelName, sPath, sID, oContext}){
        const oSettings = this._defaultFilter(sID) 
    
        const oDataBindList = this._oDataBindingList(sModelName, sPath, oContext, oSettings);
    
        const [ oDataContext ] = await oDataBindList.requestContexts()
    
        await oDataContext.delete()
    
        return oDataContext.oDeletePromise.getResult()
      }
    }
  });
