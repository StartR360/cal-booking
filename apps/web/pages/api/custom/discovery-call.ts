import type { NextApiRequest, NextApiResponse } from "next";

import { defaultResponder } from "@calcom/lib/server/defaultResponder";

interface DiscoveryCallData {
  name: string;
  email: string;
  startupName?: string;
  website?: string;
  category: string;
  discussionTopic: string;
  stage: string;
  selectedTimeSlot: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // Get available time slots for discovery call
    try {
      const { eventTypeId = "1", dateFrom, dateTo, timezone = "UTC" } = req.query;

      // For now, return mock slots since we need to implement proper slot calculation
      // In a full implementation, you would query the database for available slots
      const mockSlots = [
        "Monday, Dec 16 - 10:00 AM",
        "Monday, Dec 16 - 2:00 PM",
        "Tuesday, Dec 17 - 11:00 AM",
        "Tuesday, Dec 17 - 3:00 PM",
        "Wednesday, Dec 18 - 9:00 AM",
        "Wednesday, Dec 18 - 1:00 PM",
        "Thursday, Dec 19 - 10:00 AM",
        "Thursday, Dec 19 - 4:00 PM",
        "Friday, Dec 20 - 11:00 AM",
        "Friday, Dec 20 - 2:00 PM",
      ];

      return res.status(200).json({ slots: mockSlots });
    } catch (error) {
      console.error("Error fetching time slots:", error);
      return res.status(500).json({
        message: "Failed to fetch time slots",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (req.method === "POST") {
    // Create a discovery call booking
    try {
      const bookingData: DiscoveryCallData = req.body;

      // Validate required fields
      if (!bookingData.name || !bookingData.email || !bookingData.selectedTimeSlot) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Parse the selected time slot to get the actual date/time
      const slotDate = parseTimeSlotToDate(bookingData.selectedTimeSlot);
      if (!slotDate) {
        return res.status(400).json({ message: "Invalid time slot format" });
      }

      // Calculate end time (15 minutes for discovery call)
      const endDate = new Date(slotDate.getTime() + 15 * 60 * 1000);

      // For now, create a mock booking without database
      const mockBooking = {
        id: Math.floor(Math.random() * 10000),
        uid: generateUid(),
        title: `Discovery Call: ${bookingData.name}`,
        startTime: slotDate,
        endTime: endDate,
        description: `Startup: ${bookingData.startupName || "N/A"}
Stage: ${bookingData.stage}
Category: ${bookingData.category}
Discussion Topic: ${bookingData.discussionTopic}
Website: ${bookingData.website || "N/A"}`,
        status: "ACCEPTED",
        eventTypeId: 1,
        attendees: [
          {
            name: bookingData.name,
            email: bookingData.email,
            timeZone: "UTC",
            locale: "en",
          },
        ],
        metadata: {
          startupName: bookingData.startupName,
          website: bookingData.website,
          category: bookingData.category,
          discussionTopic: bookingData.discussionTopic,
          stage: bookingData.stage,
        },
        userId: 1,
      };

      // Generate meeting link (you might want to integrate with Google Meet API)
      const meetingLink = `https://meet.google.com/${generateMeetingId()}`;

      const bookingResult = {
        bookingId: mockBooking.id,
        meetingLink,
        selectedTimeSlot: bookingData.selectedTimeSlot,
        status: mockBooking.status,
        startTime: mockBooking.startTime,
        endTime: mockBooking.endTime,
        uid: mockBooking.uid,
      };

      return res.status(200).json(bookingResult);
    } catch (error) {
      console.error("Error creating booking:", error);
      return res.status(500).json({
        message: "Failed to create booking",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

// Helper function to parse time slot string to Date object
function parseTimeSlotToDate(timeSlot: string): Date | null {
  try {
    // Parse formats like "Monday, Dec 16 - 10:00 AM"
    const match = timeSlot.match(/(\w+),\s+(\w+)\s+(\d+)\s+-\s+(\d+):(\d+)\s+(AM|PM)/);
    if (!match) return null;

    const [, dayName, monthName, day, hour, minute, ampm] = match;
    const monthMap: { [key: string]: number } = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    let hour24 = parseInt(hour);
    if (ampm === "PM" && hour24 !== 12) hour24 += 12;
    if (ampm === "AM" && hour24 === 12) hour24 = 0;

    const year = new Date().getFullYear();
    const month = monthMap[monthName];
    const dayNum = parseInt(day);

    return new Date(year, month, dayNum, hour24, parseInt(minute));
  } catch (error) {
    console.error("Error parsing time slot:", error);
    return null;
  }
}

// Helper function to generate a unique ID
function generateUid(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Helper function to generate a meeting ID
function generateMeetingId(): string {
  return `${Math.random().toString(36).substring(2, 8)}-${Math.random()
    .toString(36)
    .substring(2, 8)}-${Math.random().toString(36).substring(2, 8)}`;
}

export default defaultResponder(handler, "/api/custom/discovery-call");
