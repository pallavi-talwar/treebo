
function BookingCalendar(startDate,days,roomTypes){
	this.startDate = moment(startDate,'DD-MM-YYYY');
	this.endDate = moment(startDate,'DD-MM-YYYY').add(days-1,'days');
	this.daysPerPage = days;
	this.currentDates = [];
	this.bookingData = [];
	this.roomTypes = roomTypes;
	this.selectedRoomType = roomTypes[0];

	this.initDatesArray = function(){
		this.currentDates = [];
		for(var i = 0; i < this.daysPerPage; i++){
			this.currentDates.push(moment(this.startDate).add(i,'days'));
		}
	}

	this.setBookingData = function(jsonData){
		this.bookingData = jsonData;
	}

	this.getBookingInfo = function(){
		return new Promise(function(resolve,reject){
			$.ajax({
				url: 'http://www.mocky.io/v2/591596dc100000b9027595b1',
				type: 'GET',
				success: function(response){
					resolve(response);
				},
				error: function(response){
					reject(response);
				}
			});
		});
	}

	this.renderBookingsView = function (roomTypeName) {
		this.initDatesArray();
		var roomType = $('#roomType').val() || roomTypeName;
		var filteredData = this.getBookingsByRoomType(roomType);
		$('#bookingInfoCalendar').html('');
		this.drawHeader();
		this.drawBookingList(filteredData);
		this.bindEventListeners();
	}

	this.drawHeader = function(){
		var tableHeader = $('<thead class="tableHeader"></thead>');
		var roomTypeDropdown = this.getRoomTypeDropdown();

		tableHeader.append($('<th class="headingCell"></th>').append(roomTypeDropdown));
		for(var i = 0; i < this.currentDates.length; i++){
			var cell = $('<th class="headingCell"></th>');
			cell.text(this.currentDates[i].format('ddd DD MMM'));
			tableHeader.append(cell);	
		}
		$('#bookingInfoCalendar').append(tableHeader);
	}

	this.drawBookingList = function(bookings){
		var self = this,
			bookingsByRoom = this.filterBookingsByRoomNumber(bookings),
			tableBody = $('<tbody class="tableBody">');

		for( room in bookingsByRoom){
			var bookingRow = $('<tr class="row">').data('id',room);
			bookingRow.append('<td class="bookingCell">'+room+'</td>');
			tableBody.append(bookingRow);
		}
		for(var i = 0; i < this.currentDates.length; i++){
			for( room in bookingsByRoom){
				var existingRow = this.getRoomRow(tableBody),
					currentRoomBookings = bookingsByRoom[room], 
					booked = false;

				$.each(currentRoomBookings, function(index, booking){
					var checkInDate = moment(booking.checkIn,'DD-MM-YYYY');
                    var checkOutDate = moment(booking.checkOut,'DD-MM-YYYY');
                    var currDate = self.currentDates[i];

                    if(self.isBooked(currDate, checkInDate, checkOutDate)){
                    	booked = true;
                    }
				});
				if(booked){
					tableBody.find(existingRow).append('<td class="bookingCell booked">Booked</td>');
				} else {
					tableBody.find(existingRow).append('<td class="bookingCell">No</td>');
				}
			}
		}

		$('#bookingInfoCalendar').append(tableBody)
	}

	this.getRoomRow = function(tableBody){
		return _.find(tableBody.find('tr'),function(row){
			return $(row).data('id') == room;
		});
	}
	this.isBooked = function(currentDate, checkIn, checkOut){
        if(checkIn.isSameOrBefore(this.startDate) || checkOut.isSameOrBefore(this.endDate)){
            if(currentDate.isSame(checkIn)){
            	return 1;
            } else if(currentDate.isBetween(checkIn,checkOut)){
                return 1;
            }
        }	
	}

	this.getRoomTypeDropdown = function(){
		var dropdownHtml = $('<select id="roomType"></select>');
		$.each(this.roomTypes, function(i, p) {

    		dropdownHtml.append($('<option></option>').val(p).html(p));
		});
		dropdownHtml.val(this.selectedRoomType);
		return dropdownHtml;
	}

	this.getBookingsByRoomType = function(roomTypeName){
		return _.where(this.bookingData,{roomType: roomTypeName});
	}

	this.filterBookingsByRoomNumber = function(bookings){
		return _.groupBy(bookings,'roomNumber');
	}

	this.getNextPage = function(){
		this.updatePageDates(true);
		this.renderBookingsView($('roomType').val());
	}

	this.getPrevPage = function(){
		this.updatePageDates(false);
		this.renderBookingsView($('roomType').val());
	}

	this.updatePageDates = function(increment){
		if(increment){
			this.startDate = this.startDate.add(this.daysPerPage,'days');
			this.endDate = moment(this.endDate).add(this.daysPerPage,'days');
		} else {
			this.startDate = this.startDate.subtract(this.daysPerPage,'days');
			this.endDate = moment(this.endDate).subtract(this.daysPerPage,'days');
		}
	}
	this.bindEventListeners = function(){
		var self = this;
		$('#roomType').on('change',function(){
			self.selectedRoomType = $(this).val();
			self.renderBookingsView();
		});
	}
}

var roomTypesArr = ['oak','maple'];
var calendar = new BookingCalendar('01-01-2017',7,roomTypesArr);

$(document).ready(function() {
	calendar.getBookingInfo().then(function(bookingJson){
		calendar.setBookingData(bookingJson);
		calendar.renderBookingsView(roomTypesArr[0]);
	}).catch(function(response){
		alert(response);
	})

	$('.pageNav').on('click',function(event){
		if($(event.target).hasClass('next')){
			calendar.getNextPage();
		} else {
			calendar.getPrevPage();
		}
	})
});
