var React = require('react');
var $ = require('jquery');

var Popup = React.createClass({

    getDefaultProps: function() {
        return {
            offset : {
                left : 0,
                top : 0
            }
        };
    },

    propTypes: {
        children: React.PropTypes.element.isRequired
    },
    /**
     * @return {object}
     */
    render: function() {
        var classString = this.props.class + " mstr-popup",
            anchor = this.props.anchor,
            position = $(anchor).offset() || {};

        position.left = (position.left || 0)  + this.props.offset.left;
        position.top = (position.top || 0)  + this.props.offset.top;

        return (
            <div className = {classString}
                style = {{
                    display: this.props.show ? 'block' : 'none'
                }}
                onClick = {this.close}>

                <div className = {'mstr-popup-contents'} style={
                {
                    display : this.props.show ? 'block' : 'none',
                    top:  position.top + 'px',
                    left : position.left + 'px'
                }
                    }
                    onClick = {function(e){e.stopPropagation();}}
                >
                    { this.props.children }
                </div>
            </div>
        );
    },

    close : function(){
        if(this.props.onClose){
            this.props.onClose();
        }
    }

});

module.exports = Popup;
