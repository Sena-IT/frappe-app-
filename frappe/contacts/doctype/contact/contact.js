// Copyright (c) 2016, Frappe Technologies and contributors
// For license information, please see license.txt

frappe.ui.form.on("Contact", {
	onload(frm) {
		frm.email_field = "email_id";
	},
	contact_type: function (frm) {
		frm.set_query("contact_category", function () {
			let filters = {};
			if (frm.doc.contact_type == "Employee") {
				filters = {
					name: ["in", ["User", "Non User"]],
				};
			} else if (["Customer", "Vendor"].includes(frm.doc.contact_type)) {
				filters = {
					name: ["in", ["Individual", "Organization"]],
				};
			}
			return {
				filters: filters,
			};
		});
	},
	contact_category: function(frm) {
		set_field_labels(frm);
	},
	refresh: function (frm) {
		if (frm.doc.__islocal) {
			const last_doc = frappe.contacts.get_last_doc(frm);
			if (
				frappe.dynamic_link &&
				frappe.dynamic_link.doc &&
				frappe.dynamic_link.doc.name == last_doc.parentname
			) {
				frm.set_value("links", "");
				frm.add_child("links", {
					link_doctype: frappe.dynamic_link.doctype,
					link_name: frappe.dynamic_link.doc[frappe.dynamic_link.fieldname],
				});
			}
		}

		if (!frm.doc.user && frm.doc.email_id) {
			frm.add_custom_button(__("Invite as User"), function () {
				return frappe.call({
					method: "frappe.contacts.doctype.contact.contact.invite_user",
					args: {
						contact: frm.doc.name,
					},
					callback: function (r) {
						frm.set_value("user", r.message);
					},
				});
			});
		}
		frm.set_query("user", function () {
			return { query: "frappe.core.doctype.user.user.user_query" };
		});

		if (frm.doc.user) {
			frm.add_custom_button(__("View User"), function () {
				frappe.set_route("Form", "User", frm.doc.user);
			});
		}

		// Set field labels based on contact category
		set_field_labels(frm);
	},
	after_save: function (frm) {
		frappe.run_serially([
			() => frappe.timeout(1),
			() => {
				const last_doc = frappe.contacts.get_last_doc(frm);
				if (
					frappe.dynamic_link &&
					frappe.dynamic_link.doc &&
					frappe.dynamic_link.doc.name == last_doc.parentname
						) {
					frappe.set_route("Form", frappe.dynamic_link.doctype, frappe.dynamic_link.doc.name);
				}
			},
		]);
	},
	validate: function (frm) {
		// clear linked customer / supplier / sales partner on saving...
		if (frm.doc.links) {
			frm.doc.links.forEach(function (d) {
				frappe.model.remove_from_locals(d.link_doctype, d.link_name);
			});
		}
	},
});

function set_field_labels(frm) {
	if (frm.doc.contact_category === 'Organization') {
		// For organizations, change labels to organization-specific ones
		frm.set_df_property('first_name', 'label', 'Organization Name');
		frm.set_df_property('mobile_no', 'label', 'Organization Mobile No');
		frm.set_df_property('email_id', 'label', 'Organization Email');
		frm.set_df_property('instagram', 'label', 'Organization Instagram');
		
		// Hide last_name field for organizations
		frm.set_df_property('last_name', 'hidden', 1);
	} else {
		// For individuals, use standard labels
		frm.set_df_property('first_name', 'label', 'First Name');
		frm.set_df_property('mobile_no', 'label', 'Mobile No');
		frm.set_df_property('email_id', 'label', 'Email Address');
		frm.set_df_property('instagram', 'label', 'Instagram');
		
		// Show last_name field for individuals
		frm.set_df_property('last_name', 'hidden', 0);
	}
}

frappe.ui.form.on("Contact Phone", {
	phone: function (frm, cdt, cdn) {
		let _phone = locals[cdt][cdn];
		if (_phone.phone && _phone.phone.length > 5) {
			if (_phone.phone.startsWith("+91")) {
				// Handle Indian phone numbers
				_phone.phone = _phone.phone.substring(3);
			}
		}
		frm.refresh_field("phone_nos");
	},
	is_primary_mobile_no: function (frm) {
		frm.refresh_field("phone_nos");
	},
});

frappe.ui.form.on("Contact Email", {
	email_id: function (frm, cdt, cdn) {
		let _email = locals[cdt][cdn];
		if (_email.email_id) {
			_email.email_id = _email.email_id.toLowerCase();
		}
		frm.refresh_field("email_ids");
	},
	is_primary: function (frm) {
		frm.refresh_field("email_ids");
	},
});

frappe.ui.form.on("Dynamic Link", {
	links_remove: function (frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		if (row.link_doctype && row.link_name) {
			// clear linked customer / supplier / sales partner on deleting...
			frappe.model.remove_from_locals(row.link_doctype, row.link_name);
		}
	},
});

frappe.ui.form.on("Organization Representative", {
	representative_name: function (frm, cdt, cdn) {
		let representative = locals[cdt][cdn];
		if (representative.representative_name) {
			// Set the representative contact from the selected name
			frappe.db.get_value("Contact", representative.representative_name, "name")
				.then((r) => {
					if (r.message) {
						representative.representative_contact = r.message.name;
						frm.refresh_field("representatives");
					}
			});
		}
	},
});

frappe.contacts = {
	clear_address_and_contact: function (frm) {
		$(frm.fields_dict["address_html"].wrapper).html("");
		$(frm.fields_dict["contact_html"].wrapper).html("");
	},
	clear_address: function (frm) {
		$(frm.fields_dict["address_html"].wrapper).html("");
	},
	get_last_doc: function (frm) {
		const reverse_doctypes = ["Customer", "Supplier", "Sales Partner", "Lead"];
		const reverse_localname = reverse_doctypes.includes(frm.doc.doctype)
			? frm.doc.name
			: frm.doc.parentname;
		return frappe.contacts.get_last_doc.last_doc[reverse_localname];
	},
};

frappe.contacts.get_last_doc.last_doc = {};
