// Handles related-objects functionality: Add Another links.

(function(o, $) {
    'use strict';

   
    o.interpolate = function(fmt, obj, named) {
        if (named) {
            return fmt.replace(/%\(\w+\)s/g, function(match){return String(obj[match.slice(2,-2)]);});
        } else {
            return fmt.replace(/%s/g, function(){return String(obj.shift());});
        }
    };

    // IE doesn't accept periods or dashes in the window name, but the element IDs
    // we use to generate popup window names may contain them, therefore we map them
    // to allowed characters in a reversible way so that we can locate the correct
    // element when the popup window is dismissed.
    o.id_to_windowname = function(text) {
        text = text.replace(/\./g, '__dot__');
        text = text.replace(/-/g, '__dash__');
        return text;
    };

    o.windowname_to_id = function(text) {
        text = text.replace(/__dot__/g, '.');
        text = text.replace(/__dash__/g, '-');
        return text;
    };

    o.showDashboardPopup = function(triggeringLink, name_regexp, add_popup) {
        var name = triggeringLink.id.replace(name_regexp, '');
        name = o.id_to_windowname(name);
        var href = triggeringLink.href;
        if (add_popup) {
            if (href.indexOf('?') === -1) {
                href += '?_popup=1';
            } else {
                href += '&_popup=1';
            }
        }
        var win = window.open(href, name, 'height=500,width=800,resizable=yes,scrollbars=yes');
        win.focus();
        return false;
    };

    o.showRelatedObjectPopup = function(triggeringLink) {
        return o.showDashboardPopup(triggeringLink, /^(update|create|delete)_/, false);
    };

    o.updateRelatedObjectLinks = function(triggeringLink) {
        var $this = $(triggeringLink);
        var siblings = $this.nextAll('.change-related, .delete-related');
        if (!siblings.length) {
            return;
        }
        var value = $this.val();
        if (value) {
            siblings.each(function() {
                var elm = $(this);
                elm.attr('href', elm.attr('data-href-template').replace('__fk__', value));
            });
        } else {
            siblings.removeAttr('href');
        }
    };

    o.dismissAddRelatedObjectPopup = function(win, newId, newRepr) {
        var name = o.windowname_to_id(win.name);
        var elem = document.getElementById(name);
        var elemName = elem.nodeName.toUpperCase();
        if (elemName === 'SELECT') {
            elem.options[elem.options.length] = new Option(newRepr, newId, true, true);
        }
        // Trigger a change event to update related links if required.
        $(elem).trigger('change');
        win.close();
    };

    o.dismissChangeRelatedObjectPopup = function(win, objId, newRepr, newId) {
        var id = o.windowname_to_id(win.name).replace(/^change_/, '');
        var selectsSelector = o.interpolate('#%s, #%s_from, #%s_to', [id, id, id]);
        var selects = $(selectsSelector);
        selects.find('option').each(function() {
            if (this.value === objId) {
                this.textContent = newRepr;
                this.value = newId;
            }
        }).trigger('change');
        win.close();
    };

    o.dismissDeleteRelatedObjectPopup = function(win, objId) {
        var id = o.windowname_to_id(win.name).replace(/^delete_/, '');
        var selectsSelector = o.interpolate('#%s, #%s_from, #%s_to', [id, id, id]);
        var selects = $(selectsSelector);
        selects.find('option').each(function() {
            if (this.value === objId) {
                $(this).remove();
            }
        }).trigger('change');
        win.close();
    };

    $('body').on('click', '.related-widget-wrapper-link', function(e) {
        e.preventDefault();
        if (this.href) {
            var event = $.Event('oscar:show-related', {href: this.href});
            $(this).trigger(event);
            if (!event.isDefaultPrevented()) {
                o.showRelatedObjectPopup(this);
            }
        }
    });
    $('body').on('change', '.related-widget-wrapper select', function() {
        var event = $.Event('oscar:update-related');
        $(this).trigger(event);
        if (!event.isDefaultPrevented()) {
            o.updateRelatedObjectLinks(this);
        }
    });
    $('.related-widget-wrapper select').trigger('change');

})(oscar || {}, jQuery);
