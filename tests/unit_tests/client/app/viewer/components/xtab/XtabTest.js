/**
 * Created by gespinola on 2/10/20.
 */
var requireReact = require('../../../../reactSetup'),
    React = require('react/addons'),
    TestUtils = React.addons.TestUtils,
    color = require('onecolor'),
    should = require('should');

var Xtab = requireReact('app/viewer/components/xtab/Xtab'),
    XtabHeader = requireReact('app/viewer/components/xtab/XtabHeader'),
    DossierModel = requireReact('app/viewer/DossierModel'),
    data = require('./XtabData');

describe('Xtab can support', function(){

    var xtab,
        model = new DossierModel(data.model);

    //make the model an instance of DossierModel
    data.model = model;

    before('prepare data', function() {
        // create xtab placeholder
        var div = document.createElement('div');
        document.body.appendChild(document.createElement('div'));
        xtab = React.render(React.createElement(Xtab, data), div);
    });

    it('should match the header background color and font color with the one from the data', function() {
        // get all dossier view component and exam its components
        should(TestUtils.isCompositeComponent(xtab)).be.true;
        var xTabHeader = TestUtils.findRenderedComponentWithType(xtab, XtabHeader);
        should(TestUtils.isCompositeComponent(xTabHeader)).be.true;
        var table = TestUtils.findRenderedDOMComponentWithTag(xTabHeader, "table");
        should(TestUtils.isDOMComponent(table)).be.true;
        should(color(table.getDOMNode().style.backgroundColor).equals(color("rgba(205,225,90,1.0)"))).be.true;
        should(color(table.getDOMNode().style.color).equals(color("rgb(255, 255, 255)"))).be.true;
    });

});
