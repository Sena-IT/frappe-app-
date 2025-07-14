# Copyright (c) 2024, Frappe Technologies and contributors
# License: MIT. See LICENSE

from frappe.model.document import Document


class OrganizationRepresentative(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		contact: DF.Link
		is_primary_representative: DF.Check
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data
	# end: auto-generated types

	def get_query(self, field):
		"""Filter contacts to show only Vendor contact types for representatives"""
		if field == "contact":
			return {
				"filters": {
					"contact_type": "Vendor"
				}
			} 