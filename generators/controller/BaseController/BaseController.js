sap.ui.define([
    "sap/ui/core/mvc/Controller",
    <% if(hasFormatter) {%>"<%=projectPathSlash%>/model/formatter", <% } %>
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    <% if(hasFactories) {%>"<%=projectPathSlash%>/model/factories", <% } %>
  ],
    function (Controller,<%if(hasFormatter){%> formatter,<%}%>Fragment, MessageBox, MessageToast<%if(hasFormatter){%>, factories<%}%>) {
        "use strict";

        const sHomeTargetName = "RouteHome";

        return Controller.extend("<%=projectPath%>.controller.BaseController", {
                getModel: function(sNameModel){
                    return this.getView().getModel(sNameModel)
                },
                setModel: function(oModel, sNameModel){
                    return this.getView().setModel(oModel, sNameModel)
                },
                onOpenDialog: function(oEvent, sDialogId){
                    const sDialog = this.DialogTypes.find(el => sDialogId?.includes(el) || oEvent.getSource().getId().includes(el))
        
                    if(!this[sDialog]){
                        this[sDialog] = this._createFragment(sDialog)
                        }
        
                        return this[sDialog].then(oDialog => {
                            this.getView().insertDependent(oDialog)
                            oDialog.open()
        
                            return oDialog
                        })
                },
                navTo: function(sRoutePath, oNavParams){
                  const oRouter = this.getOwnerComponent().getRouter();
      
                  return oRouter.navTo(sRoutePath, oNavParams)
                },
                onTabSelect: function(oEvent){
                  const oSource = oEvent.getSource()
                  const sPath = oSource.getSelectedKey()
      
                  this.navTo(sPath)
                },
                onCloseDialog: function(){
                    const oDialog = this.getDialogOpen()
                        
                    oDialog.close()
                },
                onNavTo: function(oEvent){
                    // use only when not need sID for Nav
                    // how use:
                    // define id with it pattern: (anywayData)_(sRoutePath) ex: -> id: "nav_RouteHome" 
      
                    const oSource = oEvent.getSource();
                    const sComponentId = oSource.getId()
                    const sPath = sComponentId.split('_').at(-1)
      
                    this.navTo(sPath)
                },
                navBack: function(){
                    const doesCanNavBack = history.length > 1
    
                    if(doesCanNavBack){
                        return history.back()
                    }
    
                    this.navTo(sHomeTargetName)
                },
                getDialogOpen: function(){
                    const oDialog = this.DialogTypes.reduce((oObject, sDialog) => {
                            const oDialog = this.getView().getDependents().find(el => el.isOpen())
                            
                            if(!oDialog){
                                return
                            }
    
                            const sId = oDialog.getId()
        
                            if(sId.includes(sDialog))
                                oObject = oDialog;
                                return oObject
                            }, {})
        
                    return oDialog
                },
                customError: function(sMessage, sError) {
                    MessageToast.show(sMessage);
                    console.error(sError);
                },
                customErrorBox: function({sBoxContent, sBoxTitle}){
                    return MessageBox.show(
                        sBoxContent,
                        {
                            icon: MessageBox.Icon.ERROR,
                            title: sBoxTitle,
                            actions: ["Fechar"],
                            styleClass: sResponsivePaddingClasses,
                        }
                    )
                },
                _createFragment: function(sFragment){
                    return Fragment.load({
                        name: `<%=projectPath%>.view.fragments.${sFragment}`,
                        id: this.getView().getId(),
                        controller: this
                      })
                },
        })
});