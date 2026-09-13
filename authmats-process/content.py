# Content for the Authorised Materials QC Process workbook.
# Each tab is a list of row dicts. Row kinds drive the formatting in build.py.

QC_SHEET_URL = "https://docs.google.com/spreadsheets/d/1wRlyBTznHWuJV_OhsveO_irlhJjTQre8ivJD-Bm7Lxk/edit?gid=533733026#gid=533733026"
EASSESS_URL = "https://eassessment.monash.edu/course/index.php"
EVIG_URL = "https://evigilation.monash.edu/exam-sessions"
LOOKUP_URL = "https://sites.google.com/monash.edu/exam-authorised-materials"

# ---------------------------------------------------------------- 01 Start here
START = [
    dict(k="title", b="Authorised Materials QC",
         c="Quality checking authorised materials for supervised eExams"),
    dict(k="sub", c="Exam Delivery Team process document. Version 1.0, drafted September 2026."),
    dict(k="gap"),

    dict(k="h1", c="Why we quality check authorised materials"),
    dict(k="body", c="A supervised eExam publishes its authorised materials in more than one place. Students read one source, "
                     "online supervisors read another, and in-venue supervisors read a third. Every one of those sources is "
                     "populated separately, so they can drift apart."),
    dict(k="body", c="When they drift, a student prepares against one set of rules and is invigilated against another. That is "
                     "the failure this process exists to catch. Our job is not to decide what should be permitted. Our job is to "
                     "confirm that every source says the same thing, and to raise it with the faculty when they do not."),
    dict(k="gap"),

    dict(k="h1", c="Who this is for"),
    dict(k="body", c="Anyone in the Delivery Team who has been asked to QC authorised materials, including staff doing it for the "
                     "first time. It assumes no prior knowledge of eAssessment, eVigilation or the Lookup Tool. Work through the "
                     "tabs in order the first time. After that, the Quick checklist tab is the day to day reference."),
    dict(k="gap"),

    dict(k="h1", c="What you will be working in"),
    dict(k="link_row", b="Authorised Materials QC 2026",
         c="The Google Sheet where you record every result. Open it before you start.", d=QC_SHEET_URL),
    dict(k="body", c="This document explains the process. The QC sheet is where the work is recorded. Keep both open."),
    dict(k="gap"),

    dict(k="h1", c="How this document is laid out"),
    dict(k="thead", b="Tab", c="What it covers", d="When to use it"),
    dict(k="trow", b="02 Glossary", c="Terms and abbreviations used across the process.",
         d="First read, and any time a term is unfamiliar."),
    dict(k="trow", b="03 The three sources", c="What eAssessment, eVigilation and the Lookup Tool are, who reads each one, and how to open them.",
         d="Before your first QC."),
    dict(k="trow", b="04 Auth Mat categories", c="The six authorised material categories and what each one permits.",
         d="Before your first QC, and when setting column G."),
    dict(k="trow", b="05 QC outcomes", c="The First QC Outcome and Second QC Outcome dropdown values, and when to use each.",
         d="Every time you set column H."),
    dict(k="trow", b="06 QC sheet columns", c="What every column in the QC sheet is for, and which ones are yours to fill in.",
         d="Before your first QC."),
    dict(k="trow", b="07 Process A - End of semester", c="Step by step QC for Semester 1 and Semester 2 main exam periods. Three sources.",
         d="During end of semester delivery."),
    dict(k="trow", b="08 Process B - Other deliveries", c="Step by step QC for in-semester, Deferred and Supplementary, Rescheduled Deferred and Monash College. Two sources.",
         d="Outside the main exam periods."),
    dict(k="trow", b="09 What to compare", c="The field by field comparison. Where each item appears in each source and what counts as a mismatch.",
         d="Open beside you while you QC."),
    dict(k="trow", b="10 Examples bank", c="Real cases from the 2026 QC sheet, what they looked like, and how they were resolved.",
         d="When something does not look right and you are unsure whether to flag it."),
    dict(k="trow", b="11 Escalation and reminders", c="How to flag a problem, who escalates it, and how Slack reminders are set.",
         d="When you find a discrepancy, or a unit that needs a supervisor reminder."),
    dict(k="trow", b="12 Timeline and second QC", c="When QC happens, the one week rule, and how the second QC pass works.",
         d="Planning your week, and when doing a second pass."),
    dict(k="trow", b="13 Quick checklist", c="The full sequence condensed onto one screen.",
         d="Once you know the process."),
    dict(k="trow", b="14 Screenshots to add", c="The screenshots this document needs, with capture instructions.",
         d="Document maintenance only."),
    dict(k="gap"),

    dict(k="h1", c="Two rules that apply to everything below"),
    dict(k="rule", b="1", c="You record, you do not resolve. A first QC never contacts a faculty and never edits an exam page. "
                            "You describe what you found in Comments (column I) and set the outcome. Senior Delivery decides what "
                            "is escalated and does the escalating."),
    dict(k="rule", b="2", c="If you are unsure, write it down. An entry in Comments costs nothing. A missed discrepancy costs a "
                            "student their exam conditions. Uncertainty is a reason to record, not a reason to skip."),
    dict(k="gap"),

    dict(k="h1", c="Document control"),
    dict(k="thead", b="Field", c="Detail", d=""),
    dict(k="trow", b="Owner", c="Exam Delivery Team", d=""),
    dict(k="trow", b="Approvers", c="Senior Delivery (Matt Nixon, Kayla Sgambellone)", d=""),
    dict(k="trow", b="Version", c="1.0, September 2026", d=""),
    dict(k="trow", b="Review", c="After each main delivery period, using the retro actions.", d=""),
]

# ---------------------------------------------------------------- 02 Glossary
GLOSSARY = [
    dict(k="title", b="02", c="Glossary"),
    dict(k="sub", c="Terms used throughout this document and in the QC sheet."),
    dict(k="gap"),
    dict(k="thead", b="Term", c="Definition", d=""),
]
_g = [
    ("AAA", "Alternative Assessment Arrangements. Students registered with DSS who may need adjustments such as extra time, "
            "rest breaks or specialised equipment. AAA cohorts often sit in a separate exam shell to the main cohort, which means "
            "a separate set of authorised materials to check."),
    ("Auth mats", "Shorthand for authorised materials. The items a student is permitted to have or use during their exam."),
    ("Authorised materials", "The full list of what a student may bring, access or use in an exam. Published on the eAssessment "
                             "exam landing page, in eVigilation, and for end of semester exams in the Lookup Tool."),
    ("Centrally scheduled exams", "Exams timetabled by Assessment Scheduling in line with the main University assessment periods. "
                                  "Semester 1, Semester 2, Juris Doctor Law, Suzhou, Indonesia, Deferred and Supplementary, and "
                                  "Rescheduled Deferred."),
    ("Closed Book + SPI", "Closed book with Specifically Permitted Items. The most common category, and the one where most "
                          "discrepancies are found, because the permitted items are listed individually."),
    ("Discrepancy", "Any difference between sources that would change what a student brings or what a supervisor allows."),
    ("eAssessment", "The platform students use to sit in-semester and end of semester eExams. eassessment.monash.edu"),
    ("Enrolled and Synced", "The value in column F of the QC sheet meaning the exam shell has students enrolled and has synced "
                            "to eVigilation. A unit is only ready to QC once it reads Enrolled and Synced."),
    ("Escalation Supervisors", "Exam staff who support supervisors during main delivery periods and act as the link between "
                               "supervisors and exam operations."),
    ("eVigilation", "The online supervision platform used to monitor students sitting supervised assessments. Online supervisors "
                    "read authorised materials here. evigilation.monash.edu"),
    ("eVigNS", "The eVigilation notation for the no scan invigilation type."),
    ("eVigRS", "The eVigilation notation for the room scan invigilation type."),
    ("Exam shell", "One instance of an exam on eAssessment. A single unit can have several shells in the same period, for example "
                   "an Australian sitting, a Malaysian sitting, an AAA sitting and a deferred sitting. Each shell carries its own "
                   "authorised materials and each one is checked separately."),
    ("Gen AI", "Generative artificial intelligence. Very rarely permitted. When it is, the exact string \"Gen AI\" goes in "
               "Comments so the QC sheet flags it. See the Examples bank tab."),
    ("Hybrid", "An exam where students answer partly on paper and partly on screen. eVigilation shows a Hybrid yes or no flag, and "
               "hybrid exams have answer sheets that must be accounted for."),
    ("In-semester assessment", "An assessment run during teaching, outside the main exam periods. Not carried by the Lookup Tool."),
    ("In-venue", "An assessment sat on campus or at an organised exam venue."),
    ("Invig type", "How the exam is supervised. Column D of the QC sheet. Supervised-RI is room scan, Supervised-NOI is no scan, "
                   "and the suffix says whether supervisors invigilate live or the session is recorded only."),
    ("Lookup Tool", "The Authorised Materials Search Tool. A Google Site used by in-venue supervisors on tablets. Carries centrally "
                    "scheduled end of semester exams only."),
    ("Main cohort", "The majority of students sitting under standard conditions, as distinct from an AAA cohort."),
    ("Monash College", "MC exams use three authorised material categories only: Closed Book, Closed Book + SPI, and Open Access."),
    ("Not Enrolled", "The value in column F meaning the shell has no enrolments or has not synced. Do not QC these. See the "
                     "Timeline tab for when to escalate one."),
    ("Record only", "An invigilation type where the session is recorded and reviewed rather than watched live."),
    ("Second QC", "A review of a first QC by a different person. Carried out by Senior Delivery, plus a spot check across other "
                  "reviewers' work. See the Timeline and second QC tab."),
    ("Senior Delivery", "Matt Nixon and Kayla Sgambellone. They own the orange columns in the QC sheet and all faculty escalations."),
    ("SPI", "Specifically Permitted Items."),
    ("Stagger start", "Exam sessions in the same period starting at staggered times. Slack reminders are scheduled against the "
                      "first stagger start time."),
    ("Unsupervised exam", "An assessment with no supervision. It does not appear in eVigilation and does not need an authorised "
                          "materials check. Record it as Unsupervised Exam and move on."),
    ("Working sheets", "Blank sheets a student may write on during the exam. Also called answer sheets. Students bring their own "
                       "unless the exam page says they are provided."),
]
for t, d in _g:
    GLOSSARY.append(dict(k="trow", b=t, c=d, d=""))

# ---------------------------------------------------------------- 03 The three sources
SOURCES = [
    dict(k="title", b="03", c="The three sources"),
    dict(k="sub", c="What each source is, who reads it, and how to open it. Read this before your first QC."),
    dict(k="gap"),
    dict(k="body", c="Authorised materials are published in up to three places. Which ones apply depends on the delivery period, "
                     "and that split determines everything downstream."),
    dict(k="gap"),

    dict(k="h1", c="At a glance"),
    dict(k="thead", b="Source", c="What it is and who reads it", d="Applies to"),
    dict(k="trow", b="eAssessment",
         c="The platform students sit their exam in. The exam landing page carries an Instructions section and an Authorised "
           "Materials section. This is the source students read, and it is the most detailed of the three because the Instructions "
           "section is free text.",
         d="Every supervised exam."),
    dict(k="trow", b="eVigilation",
         c="The online supervision platform. Online supervisors read authorised materials here, from the Authorised Materials "
           "panel behind the information icon. The fields are fixed, which means wording is constrained and detail is sometimes lost.",
         d="Every supervised exam."),
    dict(k="trow", b="Lookup Tool",
         c="A Google Site, formally the Authorised Materials Search Tool. In-venue supervisors read it on tablets at the venue. "
           "It carries centrally scheduled end of semester exams only.",
         d="End of semester exams only."),
    dict(k="note", c="The Authorised Materials QC 2026 sheet is not a source. It is where you record what the sources say."),
    dict(k="gap"),

    dict(k="h1", c="Which sources apply to your exam"),
    dict(k="thead", b="Delivery period", c="Sources to check", d="Notes"),
    dict(k="trow", b="End of semester (Semester 1 and Semester 2 main exam periods)",
         c="Three. eAssessment, eVigilation and the Lookup Tool. All three must agree.",
         d="These are the exams in-venue supervisors invigilate, which is why the Lookup Tool matters."),
    dict(k="trow", b="In-semester assessments, Deferred and Supplementary, Rescheduled Deferred, Monash College, and exams for "
                     "external clients",
         c="Two. eAssessment and eVigilation. Both must agree.",
         d="The Lookup Tool does not carry these units. Do not check it, and never record a discrepancy because a unit is absent "
           "from it."),
    dict(k="trow", b="Malaysia, Suzhou, Indonesia and other international sittings",
         c="The same as their Australian equivalent for that delivery period.",
         d="There is no separate procedure. What changes is that these units usually have a second shell, so make sure you are "
           "reading the right one."),
    dict(k="gap"),

    dict(k="h1", c="eAssessment: how to open it"),
    dict(k="step", b="1", c="From the QC sheet, click the link in column B for the unit you are checking. This opens the exam "
                            "landing page directly and is the fastest route."),
    dict(k="step", b="2", c="If column B is blank or the link fails, go to eAssessment and search the unit code in the Search "
                            "courses field."),
    dict(k="link_row", b="eAssessment", c="eassessment.monash.edu", d=EASSESS_URL),
    dict(k="step", b="3", c="Select the correct shell. There are often several for the same unit code. Match the year, the "
                            "assessment period, the sitting (Australia or Malaysia), and whether it is a main cohort, AAA or "
                            "deferred shell. The shell name in column A of the QC sheet tells you which one you want."),
    dict(k="step", b="4", c="On the landing page, read both the Instructions section and the Authorised Materials section. "
                            "Instructions is free text and often carries conditions that do not appear anywhere else, such as "
                            "copy and paste restrictions or an additional device."),
    dict(k="ss", c="SS-01  eAssessment exam landing page, showing the Instructions and Authorised Materials sections. "
                   "Annotate both section headings."),
    dict(k="gap"),

    dict(k="h1", c="eVigilation: how to open it"),
    dict(k="step", b="1", c="Go to eVigilation and open the Exam sessions tab from the left hand navigation."),
    dict(k="link_row", b="eVigilation", c="evigilation.monash.edu/exam-sessions", d=EVIG_URL),
    dict(k="step", b="2", c="Set Select a date to the exam date. This is the step most often missed. eVigilation shows nothing "
                            "useful until the date is right, and a unit that looks missing is usually a unit on another date."),
    dict(k="step", b="3", c="Set Search by to Exam unit, type the unit code, and search. You can also search by Session and browse "
                            "everything running that day, which is useful when you are working through a whole date."),
    dict(k="step", b="4", c="In the results, click the information icon next to the unit name. This opens the Authorised Materials "
                            "panel."),
    dict(k="step", b="5", c="Read the whole panel and scroll to the bottom. The panel lists the category heading, then Calculator, "
                            "Dictionary, Notes, Other, Permitted Item, Textbook and Working Sheets, then the Hybrid flag. A green "
                            "tick means permitted, a red dash means not permitted, and the line underneath carries the detail."),
    dict(k="ss", c="SS-02  eVigilation Exam sessions search, with the date field and Search by field annotated. Crop to the search "
                   "panel only."),
    dict(k="ss", c="SS-03  eVigilation Authorised Materials panel opened from the information icon, showing the full field list "
                   "including the Hybrid flag."),
    dict(k="gap"),

    dict(k="h1", c="Lookup Tool: how to open it"),
    dict(k="body", c="End of semester exams only. Skip this source entirely for every other delivery."),
    dict(k="step", b="1", c="Open the Authorised Materials Search Tool."),
    dict(k="link_row", b="Lookup Tool", c="sites.google.com/monash.edu/exam-authorised-materials", d=LOOKUP_URL),
    dict(k="step", b="2", c="Set the date filter to the exam date before you search. As with eVigilation, the wrong date returns "
                            "nothing and looks like a missing unit."),
    dict(k="step", b="3", c="Search the unit code and open the unit card. Read the card in full."),
    dict(k="ss", c="SS-04  Lookup Tool search with the date filter set, and the unit card open. Annotate the date filter."),
    dict(k="note", c="The Lookup Tool is what an in-venue supervisor holds in their hands at the venue. If its card is wrong, the "
                     "person enforcing the rules in the room has the wrong rules."),
]

# ---------------------------------------------------------------- 04 Categories
CATEGORIES = [
    dict(k="title", b="04", c="Auth Mat categories"),
    dict(k="sub", c="The six values in the Auth Mat Category dropdown, column G of the QC sheet."),
    dict(k="gap"),
    dict(k="body", c="The category describes what kind of exam it is. Set it to match what the exam actually permits, not what you "
                     "expect for that faculty or unit. If the exam does not fit any category cleanly, that is itself worth recording "
                     "in Comments."),
    dict(k="gap"),
    dict(k="thead", b="Category", c="What it permits", d="What to check most carefully"),
    dict(k="trow", b="Closed Book",
         c="Nothing beyond the standard exam environment. No notes, no calculator, no additional resources.",
         d="That nothing has crept into the Instructions section. A Closed Book exam that mentions a calculator or a formula sheet "
           "in Instructions is not Closed Book."),
    dict(k="trow", b="Closed Book + SPI",
         c="Closed book with Specifically Permitted Items. A defined, listed set of items is allowed, for example a physical "
           "calculator, a named virtual calculator, working sheets, or a limited number of pages of notes.",
         d="Every listed item, one at a time, in every source. This is the most common category and the one where most "
           "discrepancies are found, because each item is a separate opportunity for the sources to disagree."),
    dict(k="trow", b="Open Book",
         c="The student may refer to hardcopy reference materials such as textbooks, physical notes or a dictionary.",
         d="Whether the materials are limited to hardcopy. Soft copy reference material is not permitted under this category by "
           "convention, so an Instructions section that permits digital notes is a mismatch with the category."),
    dict(k="trow", b="Open Book with Additional Device",
         c="Open Book, plus a second device. Typically a laptop, tablet or monitor. Not a phone. In most cases the second device "
           "is not connected to the internet.",
         d="That the additional device is stated. It usually appears only in the eAssessment Instructions section and not in "
           "eVigilation. See the Examples bank tab."),
    dict(k="trow", b="Open Access",
         c="Broad access to resources during the exam.",
         d="Whether generative AI is permitted. Almost all Open Access exams explicitly prohibit it. The rare exception needs "
           "flagging. See the Examples bank tab."),
    dict(k="trow", b="Open Access with Additional Device",
         c="Open Access, plus a second device. Typically a laptop, tablet or monitor. Not a phone. Unlike Open Book with "
           "Additional Device, the second device may be connected to the internet and soft copy notes are permitted on it.",
         d="That the additional device is stated, and that a supervisor reminder is flagged. Every unit in this category needs a "
           "Slack reminder. See the Escalation and reminders tab."),
    dict(k="gap"),
    dict(k="note", c="Monash College exams use three categories only: Closed Book, Closed Book + SPI, and Open Access."),
    dict(k="ss", c="SS-05  Side by side crop of an Open Access with Additional Device exam. The eAssessment Instructions section "
                   "stating the additional device, next to the eVigilation panel where it does not appear."),
]

# ---------------------------------------------------------------- 05 QC outcomes
OUTCOMES = [
    dict(k="title", b="05", c="QC outcomes"),
    dict(k="sub", c="The dropdown values you set once you have compared the sources."),
    dict(k="gap"),

    dict(k="h1", c="First QC Outcome (column H). You set this."),
    dict(k="thead", b="Value", c="Use it when", d="Also do this"),
    dict(k="trow", b="All Match (eVig, eA, Lookup)",
         c="Every source that applies to this delivery period says the same thing. Three sources for end of semester, two sources "
           "for every other delivery.",
         d="Nothing further, unless the unit needs a supervisor reminder."),
    dict(k="trow", b="Discrepancy",
         c="The sources do not agree. An item is permitted in one place and not another, or the wording differs in a way that "
           "would change what a student brings or what a supervisor allows.",
         d="Describe the difference in Comments (column I). Name the source and quote the wording from each. Senior Delivery "
           "cannot act on \"does not match\"."),
    dict(k="trow", b="All Match but Escalation Required",
         c="The sources agree with each other, but what they agree on needs a faculty decision. Contradictory or unclear "
           "instructions, an unenforceable condition, or something outside normal exam conventions.",
         d="Explain what needs deciding in Comments, and why."),
    dict(k="trow", b="Other",
         c="The check does not fit the values above. Most often used where an item is provided inside the exam rather than brought "
           "by the student, or where an unusual condition applies that is not a mismatch.",
         d="Always explain in Comments. Other with an empty Comments cell tells the next person nothing."),
    dict(k="trow", b="Unsupervised Exam",
         c="The assessment turns out not to be supervised, so it does not appear in eVigilation and no authorised materials check "
           "applies.",
         d="Note the date you confirmed it in Comments, then move on."),
    dict(k="gap"),
    dict(k="note", c="The value name All Match (eVig, eA, Lookup) lists three sources, but it is still the correct answer for a "
                     "two source check. Do not read the absence of the Lookup Tool as a reason to avoid it."),
    dict(k="gap"),

    dict(k="h1", c="Second QC Outcome (column J). Senior Delivery sets this."),
    dict(k="body", c="Column J is orange, which in the QC sheet means Senior Delivery owns it. Do not fill it in. It is listed here "
                     "so you know what happens to your work after you record it."),
    dict(k="thead", b="Value", c="What it means", d=""),
    dict(k="trow", b="QC Complete", c="The first QC has been reviewed and the unit needs nothing further.", d=""),
    dict(k="trow", b="Escalation Required", c="The unit is going to the faculty. Senior Delivery raises it and tracks it through "
                                              "columns L and M.", d=""),
    dict(k="gap"),
    dict(k="h1", c="Worked judgement calls"),
    dict(k="thead", b="Situation", c="Outcome", d="Why"),
    dict(k="trow", b="eVigilation says working sheets Yes. The Lookup Tool says 99. eAssessment says 5 answer sheets.",
         c="All Match", d="Yes and 99 both mean unlimited, and a specific count on eAssessment is a tighter statement of the same "
                          "permission. See the Examples bank tab."),
    dict(k="trow", b="eVigilation Notes reads None, but the eAssessment page permits one double sided A4 page of notes.",
         c="Discrepancy", d="A supervisor reading eVigilation would confiscate notes the student is entitled to have. Record it "
                            "even though the cause is a known platform limitation."),
    dict(k="trow", b="All three sources agree that a mobile phone is permitted.",
         c="All Match but Escalation Required", d="The sources match, but the condition itself needs a faculty decision."),
    dict(k="trow", b="A formula sheet appears as an image on an exam page but is not listed in authorised materials anywhere.",
         c="Other", d="It is exam content rather than an authorised material, so there is nothing to match. Note it in Comments."),
    dict(k="trow", b="The unit is not in eVigilation and column F reads Not Enrolled.",
         c="Leave blank", d="The unit is not ready to QC. Do not record a discrepancy. See the Timeline tab for when this becomes "
                            "an escalation."),
]

# ---------------------------------------------------------------- 06 Sheet columns
COLUMNS = [
    dict(k="title", b="06", c="QC sheet columns"),
    dict(k="sub", c="What every column in the Authorised Materials QC 2026 sheet is for."),
    dict(k="gap"),
    dict(k="link_row", b="Open the QC sheet", c="Authorised Materials QC 2026", d=QC_SHEET_URL),
    dict(k="gap"),
    dict(k="body", c="Three columns are yours: G, H and I. Everything else is either populated automatically or owned by Senior "
                     "Delivery."),
    dict(k="gap"),
    dict(k="thead", b="Col", c="Column and what goes in it", d="Who fills it"),
    dict(k="trow", b="A", c="Course Name. The exam shell name, including the unit code, year, delivery period and sitting. For "
                            "example ACW3120 2026 Sem 2 Mid-Semester (Malaysia Only). Use this to confirm you have opened the "
                            "right shell.", d="Automatic"),
    dict(k="trow", b="B", c="Link. The eAssessment link for that shell. Click it to open the exam landing page.", d="Automatic"),
    dict(k="trow", b="C", c="Status. Where the shell sits in the build process. 04.Handed over for QC is the value that matters "
                            "to you.", d="Automatic"),
    dict(k="trow", b="D", c="Invig Type. How the exam is supervised, for example Supervised-RI-Invigilated or "
                            "Supervised-NOI-RecordOnly.", d="Automatic"),
    dict(k="trow", b="E", c="Start Time. Scheduled date and time. Use this to work date by date, and to judge the one week rule "
                            "on the Timeline tab.", d="Automatic"),
    dict(k="trow", b="F", c="Enrolment Status. Enrolled and Synced means the unit is ready to QC. Not Enrolled means it is not. "
                            "Check this before you open anything.", d="Automatic"),
    dict(k="trow_you", b="G", c="Auth Mat Category. Dropdown. Set it to the category the exam actually is. See the Auth Mat "
                                "categories tab.", d="You"),
    dict(k="trow_you", b="H", c="First QC Outcome. Dropdown. Set it once you have compared every source that applies. See the "
                                "QC outcomes tab.", d="You"),
    dict(k="trow_you", b="I", c="Comments. Free text. Anything noteworthy, ambiguous, provided inside the exam, or worth a second "
                                "opinion. Name the source and quote the wording. This is the column Senior Delivery reads to decide "
                                "what gets escalated.", d="You"),
    dict(k="trow_snr", b="J", c="Second QC Outcome (Senior Delivery Members).", d="Senior Delivery"),
    dict(k="trow_snr", b="K", c="Reminder Required. Checkbox.", d="Senior Delivery"),
    dict(k="trow_snr", b="L", c="Escalated? Checkbox, ticked once the unit has been raised with the faculty.", d="Senior Delivery"),
    dict(k="trow_snr", b="M", c="Resolved? Checkbox, ticked once the faculty has actioned it.", d="Senior Delivery"),
    dict(k="trow_snr", b="N", c="Reminder Set. Checkbox, ticked once the Slack reminder is scheduled.", d="Senior Delivery"),
    dict(k="trow", b="R to U", c="Automatic flags derived from your Comments and the exam data. They drive the QC Overview tab, "
                                 "which is how Senior Delivery finds units needing attention. Open with additional device, AI, "
                                 "Answer Sheets Count, and D/U.", d="Automatic"),
    dict(k="gap"),
    dict(k="note", c="Orange columns belong to Senior Delivery (Matt Nixon and Kayla Sgambellone). Do not fill them in. Your job is "
                     "to give them enough in Comments to act on, and to prompt them when a unit marked Discrepancy or All Match but "
                     "Escalation Required has not moved."),
    dict(k="gap"),
    dict(k="h1", c="Why your Comments wording matters"),
    dict(k="body", c="Column S flags AI permitted units automatically by reading Comments. It looks for the string \"Gen AI\". "
                     "Capitalisation does not matter, but the spelling and the space between the two words do. Write Gen AI exactly "
                     "and the unit appears on the QC Overview tab. Write GenAI or AI and it will not."),
    dict(k="ss", c="SS-06  The QC sheet with columns A to N visible, and columns G, H and I highlighted."),
    dict(k="ss", c="SS-07  The QC Overview tab, showing the First QC Required, Outstanding Issues not escalated, Reminder required "
                   "but not set, Open Access with Additional Device, and AI Permitted Assessments lists."),
]

# ---------------------------------------------------------------- 07 Process A
PROCESS_A = [
    dict(k="title", b="07", c="Process A: End of semester"),
    dict(k="sub", c="Semester 1 and Semester 2 main exam periods. Three sources: eAssessment, eVigilation and the Lookup Tool."),
    dict(k="gap"),
    dict(k="body", c="Work one exam date at a time. Filter the QC sheet by Start Time (column E), sort the unit names A to Z, and "
                     "go down the list. Working by date keeps you aligned with how eVigilation and the Lookup Tool are searched, "
                     "since both need a date set before they return anything."),
    dict(k="gap"),

    dict(k="step", b="1", c="Open the QC sheet and filter to one exam date using Start Time (column E). Sort column A "
                            "alphabetically within that date."),
    dict(k="step", b="2", c="Check Enrolment Status (column F). If it reads Enrolled and Synced, continue. If it reads Not "
                            "Enrolled, skip the unit and leave G, H and I blank. Do not record a discrepancy for a unit that is "
                            "not ready. If the exam is within a week, see the Timeline tab."),
    dict(k="step", b="3", c="Open eAssessment by clicking the link in column B. Confirm the shell name on the page matches column "
                            "A, including the sitting and cohort."),
    dict(k="step", b="4", c="Read the Instructions section and the Authorised Materials section in full. Note every permitted item "
                            "and every condition. The Instructions section is free text and regularly carries conditions that "
                            "appear nowhere else."),
    dict(k="ss", c="SS-01  eAssessment exam landing page, Instructions and Authorised Materials sections."),
    dict(k="step", b="5", c="Open eVigilation, go to Exam sessions, set the date to the exam date, set Search by to Exam unit, and "
                            "search the unit code."),
    dict(k="ss", c="SS-02  eVigilation Exam sessions search with the date and Search by fields annotated."),
    dict(k="step", b="6", c="Click the information icon next to the unit to open the Authorised Materials panel. Read it in full "
                            "and scroll to the bottom, including the Hybrid flag."),
    dict(k="ss", c="SS-03  eVigilation Authorised Materials panel."),
    dict(k="step", b="7", c="Open the Lookup Tool, set the date filter to the exam date, search the unit code, and read the unit "
                            "card."),
    dict(k="ss", c="SS-04  Lookup Tool with the date filter set and the unit card open."),
    dict(k="step", b="8", c="Compare the three sources field by field using the What to compare tab. Do not skim for an overall "
                            "impression. Take the fields one at a time."),
    dict(k="step", b="9", c="Set Auth Mat Category (column G) to the category the exam actually is."),
    dict(k="step", b="10", c="Set First QC Outcome (column H). All Match (eVig, eA, Lookup) when all three agree. Discrepancy "
                             "when they do not. All Match but Escalation Required when they agree but the condition itself needs a "
                             "faculty decision. Other when none of those fit."),
    dict(k="step", b="11", c="Write what you found in Comments (column I) for anything other than a clean match. Name each source "
                             "and quote its wording. \"eVig Notes: None. eA: one double sided A4 page permitted\" is actionable. "
                             "\"Notes discrepancy\" is not."),
    dict(k="step", b="12", c="If the unit is Open Access with Additional Device, or permits generative AI, it needs a supervisor "
                             "reminder. Record it in Comments, using the exact string Gen AI for AI units, and see the Escalation "
                             "and reminders tab."),
    dict(k="step", b="13", c="Move to the next unit. When the date is finished, check the QC sheet for units added after you "
                             "filtered, then move to the next date."),
    dict(k="gap"),
    dict(k="note", c="You never contact a faculty and you never edit an exam page. Recording the detail is the whole of your job at "
                     "first QC."),
]

# ---------------------------------------------------------------- 08 Process B
PROCESS_B = [
    dict(k="title", b="08", c="Process B: All other deliveries"),
    dict(k="sub", c="In-semester assessments, Deferred and Supplementary, Rescheduled Deferred, Monash College, and exams for "
                    "external clients. Two sources: eAssessment and eVigilation."),
    dict(k="gap"),
    dict(k="body", c="The process is identical to Process A with one step removed. The Lookup Tool does not carry these units, so "
                     "there is nothing to check there and a unit's absence from it is never a discrepancy."),
    dict(k="gap"),

    dict(k="step", b="1", c="Open the QC sheet and filter to one exam date using Start Time (column E). Sort column A "
                            "alphabetically within that date."),
    dict(k="step", b="2", c="Check Enrolment Status (column F). Enrolled and Synced means continue. Not Enrolled means skip, and "
                            "leave G, H and I blank."),
    dict(k="step", b="3", c="Open eAssessment by clicking the link in column B. Confirm the shell name matches column A. These "
                            "deliveries have more shells per unit than end of semester does, so this check matters more here. A "
                            "single unit can have an Australian and a Malaysian sitting, a main cohort and an AAA cohort, and a "
                            "deferred shell, all in the same window."),
    dict(k="step", b="4", c="Read the Instructions section and the Authorised Materials section in full."),
    dict(k="ss", c="SS-01  eAssessment exam landing page, Instructions and Authorised Materials sections."),
    dict(k="step", b="5", c="Open eVigilation, go to Exam sessions, set the date, set Search by to Exam unit, and search the unit "
                            "code."),
    dict(k="ss", c="SS-02  eVigilation Exam sessions search with the date and Search by fields annotated."),
    dict(k="step", b="6", c="Click the information icon to open the Authorised Materials panel. Read it in full, including the "
                            "Hybrid flag."),
    dict(k="ss", c="SS-03  eVigilation Authorised Materials panel."),
    dict(k="step", b="7", c="Compare the two sources field by field using the What to compare tab."),
    dict(k="step", b="8", c="Set Auth Mat Category (column G), then First QC Outcome (column H). All Match (eVig, eA, Lookup) is "
                            "still the correct value when both sources agree, despite the name."),
    dict(k="step", b="9", c="Write what you found in Comments (column I) for anything other than a clean match. Name each source "
                            "and quote its wording."),
    dict(k="step", b="10", c="Flag reminder units. Open Access with Additional Device and generative AI units need a supervisor "
                             "reminder regardless of delivery period."),
    dict(k="gap"),
    dict(k="h1", c="Differences worth knowing"),
    dict(k="thead", b="Point", c="Detail", d=""),
    dict(k="trow", b="Multiple shells", c="Australian and Malaysian sittings of the same unit frequently differ. Check both, and "
                                          "compare them against each other as well as against eVigilation. A difference between "
                                          "the two sittings is worth recording even when each is internally consistent.", d=""),
    dict(k="trow", b="Monash College", c="Three categories only: Closed Book, Closed Book + SPI, and Open Access.", d=""),
    dict(k="trow", b="Late shells", c="These deliveries sync closer to the exam date than end of semester exams do. A unit that "
                                      "read Not Enrolled yesterday may be ready today. Re-check the sheet rather than assuming.", d=""),
    dict(k="trow", b="Unsupervised units", c="Units sometimes move from record only to unsupervised after the shell is built. They "
                                             "then disappear from eVigilation. Set First QC Outcome to Unsupervised Exam and note "
                                             "the date you confirmed it.", d=""),
]

# ---------------------------------------------------------------- 09 What to compare
COMPARE = [
    dict(k="title", b="09", c="What to compare"),
    dict(k="sub", c="The field by field check. Keep this tab open beside you while you QC."),
    dict(k="gap"),
    dict(k="body", c="Take the fields one at a time. Comparing overall impressions is how discrepancies get missed, because the two "
                     "sources describe the same permission in different words and the eye slides over the difference."),
    dict(k="gap"),
    dict(k="thead", b="Field", c="Where to find it", d="What counts as a mismatch"),
    dict(k="trow", b="Category",
         c="eAssessment: the heading above the authorised materials list. eVigilation: the heading at the top of the panel, for "
           "example \"Closed book with specifically permitted items\". Lookup Tool: on the unit card.",
         d="Different categories in different sources. Also a category that does not match its own contents, such as a Closed Book "
           "exam listing a calculator."),
    dict(k="trow", b="Calculator",
         c="eAssessment: the Calculator line, plus any mention in Instructions. eVigilation: the Calculator field, which reads "
           "Physical Calculator, a named virtual calculator, or None.",
         d="One source permitting a physical calculator and another a virtual one, or a named product appearing in one source only. "
           "Wording such as \"faculty approved calculator\" needs escalating rather than matching."),
    dict(k="trow", b="Dictionary",
         c="eAssessment: listed as a permitted item. eVigilation: the Dictionary field.",
         d="Permitted in one source and None in another. Note the known platform limitation below before recording it."),
    dict(k="trow", b="Notes",
         c="eAssessment: the Notes line and the Instructions section. eVigilation: the Notes field.",
         d="A difference in whether notes are permitted at all, whether they are physical or digital, how many pages, and whether "
           "double sided pages are allowed. Wording differences that describe the same limit are not a mismatch."),
    dict(k="trow", b="Textbook",
         c="eAssessment: listed as a permitted item. eVigilation: the Textbook field.",
         d="Permitted in one source and N/A or None in another."),
    dict(k="trow", b="Working sheets and answer sheets",
         c="eAssessment: usually a specific number in Instructions. eVigilation: the Working Sheets field, usually Yes or No. "
           "Lookup Tool: sometimes a number such as 99.",
         d="Permitted in one source and not another. Yes against 99 is not a mismatch, both mean unlimited. A specific number on "
           "eAssessment against Yes elsewhere is not a mismatch either. Record the count in Comments."),
    dict(k="trow", b="Other and Permitted Item",
         c="eAssessment: the Other line and Instructions. eVigilation: the Other and Permitted Item fields, which are free text.",
         d="Anything present in one source and absent from another. This is where software, Excel, formula sheets and unusual "
           "permissions land, so read it carefully."),
    dict(k="trow", b="Additional device",
         c="Almost always the eAssessment Instructions section only. It does not appear in the eVigilation panel.",
         d="Not a mismatch when eVigilation is silent, because the field does not exist there. It is a mismatch when the category "
           "says Additional Device and no source describes what the device may be."),
    dict(k="trow", b="Generative AI",
         c="eAssessment Instructions, usually as an explicit prohibition. Occasionally as an explicit permission.",
         d="Any unit that permits generative AI needs flagging, whether or not the sources agree."),
    dict(k="trow", b="Hybrid",
         c="eVigilation: the Hybrid yes or no flag at the bottom of the panel. eAssessment: answer sheet instructions.",
         d="Hybrid marked yes with no answer sheets accounted for, or answer sheet counts that differ between sources."),
    dict(k="trow", b="Copy and paste, translation and other restrictions",
         c="eAssessment Instructions section only.",
         d="Not a source mismatch, since the other sources have nowhere to state it. Record restrictions that are difficult to "
           "enforce, and record any restriction that contradicts something else on the same page."),
    dict(k="trow", b="Sitting and cohort",
         c="The shell name in column A, against the page you have open.",
         d="You are reading the wrong shell. Check this first when something looks badly wrong."),
    dict(k="gap"),

    dict(k="h1", c="Known platform limitations. Check these before recording a discrepancy."),
    dict(k="thead", b="Behaviour", c="What is actually happening", d="What to do"),
    dict(k="trow", b="eVigilation Notes or Dictionary reads None while the exam page permits them.",
         c="The eVigilation platform will not allow the Dictionary and Notes fields to be populated once the Other field has been "
           "filled in. It is a platform constraint, not a faculty error.",
         d="Still record it. A supervisor reading eVigilation would enforce the wrong rule. Note the limitation in Comments so "
           "Senior Delivery can triage it quickly."),
    dict(k="trow", b="Textbook and Other cannot both be populated.",
         c="The same constraint. Selecting Textbook prevents other permitted items being entered into Other.",
         d="Record it, and note the limitation."),
    dict(k="trow", b="Notes wording never matches exactly.",
         c="The Notes dropdown available to academics offers three values only: None, Notes - Double sided A4 x1 - Physical Only, "
           "and Notes - Double sided A4 x5 max - Physical Only. Free text on eAssessment will describe the same limit differently.",
         d="Compare the meaning, not the words. \"Notes - Double sided A4 x 1 - Physical Only\" and \"One page (both sides) of "
           "written material is permitted\" are the same permission."),
    dict(k="trow", b="Excel appears under Other rather than Calculator.",
         c="Excel is not one of the values in the calculator dropdown academics choose from, so it can only be entered as free "
           "text under Other.",
         d="Not a discrepancy. A physical calculator heading plus Excel under Other means exactly that, and no other virtual "
           "calculator is permitted."),
]

# ---------------------------------------------------------------- 10 Examples bank
EXAMPLES = [
    dict(k="title", b="10", c="Examples bank"),
    dict(k="sub", c="Real cases from the 2026 QC sheet. What was seen, whether it was a discrepancy, and how it was resolved."),
    dict(k="gap"),
    dict(k="body", c="These are the situations that come up most often and the ones new QCers most often get wrong in either "
                     "direction, by escalating something normal or by passing over something that matters. Each example names what "
                     "you would see, the call that was made, and why."),
]
_ex = [
    ("Open Access with Additional Device",
     "The exam page Instructions section says a second device is permitted. The eVigilation panel says nothing about a device, "
     "because eVigilation has no field for one.",
     "Not a discrepancy. eVigilation cannot state it.",
     "Set the category to Open Access with Additional Device, record the device wording in Comments, and flag it for a supervisor "
     "reminder. Every unit in this category needs one. The device may be a laptop or tablet but never a phone, and under Open "
     "Access the second device may be connected to the internet and carry soft copy notes. Under Open Book with Additional Device "
     "it may not be connected.",
     "SS-08  eAssessment Instructions section stating the additional device, cropped to the sentence."),

    ("Generative AI permitted",
     "The exam page permits generative AI, or permits a tool whose AI functionality is explicitly allowed. Rare. Almost every "
     "Open Access exam prohibits it instead.",
     "Not a discrepancy on its own, but always flagged.",
     "Write the exact string \"Gen AI\" in Comments. Capitalisation does not matter, the spelling and the space do. That string is "
     "what column S reads to put the unit on the QC Overview tab, and the unit needs a Slack reminder. Wolfram Alpha is the common "
     "edge case: it is a long standing permitted virtual calculator and it has AI features, but unless the exam page explicitly "
     "permits the AI functionality, students should not be using it.",
     "SS-09  eAssessment Instructions section permitting generative AI, and the Comments cell showing Gen AI recorded."),

    ("Working sheet counts that look different but are not",
     "eVigilation Working Sheets reads Yes. The Lookup Tool card reads 99. The eAssessment page says 5 answer sheets.",
     "Not a discrepancy.",
     "Yes and 99 both mean unlimited. A specific number on eAssessment is a tighter statement of the same permission and is common "
     "in Business and Economics units, where working sheets are frequently limited to five. Record the count in Comments so the "
     "answer sheet count column picks it up, and move on. The mismatch to record is a source saying working sheets are not "
     "permitted while another permits them.",
     "SS-10  Three way crop: eVigilation Working Sheets Yes, Lookup Tool 99, eAssessment 5 answer sheets."),

    ("eVigilation says no notes but notes are permitted",
     "The eVigilation Notes field reads None, and the exam page permits notes. This recurs across many units.",
     "Discrepancy, and record it every time.",
     "The cause is a platform limitation. Once the Other field is populated, eVigilation will not allow the Notes or Dictionary "
     "fields to be filled in. The cause does not change the risk: an online supervisor reading eVigilation would stop a student "
     "using notes they are entitled to. Record it, and note that the Other field is populated so Senior Delivery can triage it "
     "quickly.",
     "SS-11  eVigilation panel with Notes None and Other populated, next to the eAssessment page permitting notes."),

    ("Notes wording that differs but means the same thing",
     "eVigilation reads \"Notes - Double sided A4 x 1 - Physical Only\". The exam page reads \"One page (both sides) of written "
     "material is permitted\".",
     "Not a discrepancy.",
     "Both describe one double sided A4 page of physical notes. The Notes dropdown available to academics has only three values, so "
     "the free text on eAssessment will almost never be word for word identical. Compare the permission, not the phrasing. Physical "
     "notes may be handwritten or typed unless the page says otherwise.",
     "SS-12  Side by side crop of the two wordings."),

    ("\"Open notes\" in Nursing units",
     "The exam page says open notes, with no further definition.",
     "Not a discrepancy, but worth knowing.",
     "Open notes is established terminology in Nursing units and means handwritten notes written in fresh ink, not photocopied. It "
     "is used on the Moodle site information students read. If the phrase appears outside Nursing, or the exam page gives no other "
     "context, record it in Comments.",
     ""),

    ("Excel as the permitted calculator",
     "The exam page lists a physical calculator under Calculator, and Excel under Other. No virtual calculator heading appears.",
     "Not a discrepancy.",
     "Excel is not one of the values in the calculator dropdown, so it can only be entered as free text under Other. Listing a "
     "virtual calculator heading would imply all virtual calculators are permitted, which is not the intent. Where Excel is the "
     "only permitted calculation tool, expect no physical or virtual calculator at all and Excel under Other. Students may use "
     "pre-existing content in their Excel files. The permission is to use the program, not to start from a blank workbook.",
     "SS-13  eAssessment authorised materials showing a physical calculator and Excel listed under Other."),

    ("Formula sheets",
     "The exam page mentions a formula sheet, or a formula sheet appears inside the exam, and it is not listed in the authorised "
     "materials.",
     "Depends on where the formula sheet lives.",
     "A formula sheet included as an image on an exam page is exam content, not an authorised material, and is correctly absent "
     "from the list. A formula sheet that opens as a link or a PDF in a separate tab should be listed, because supervisors check "
     "what students have open. Students are often sent the formula sheet through Moodle beforehand and may bring a printed copy, "
     "which is counted separately from any permitted physical notes. If a formula sheet opens as a link and is not listed, record "
     "it as Other with the detail in Comments.",
     "SS-14  An exam page with an in-exam formula sheet, and a second crop of a linked formula sheet listed in authorised "
     "materials."),

    ("Copy and paste restrictions",
     "The exam page prohibits copying and pasting, sometimes including copying between the notes window and the response window "
     "within the exam itself.",
     "Not a source mismatch, but record it.",
     "No other source has anywhere to state it, so there is nothing to compare against. Record it because it is very difficult to "
     "enforce and supervisors need to know. Restrictions on copying to or from external sources are conventional. A restriction on "
     "copying within the platform is the one to note.",
     "SS-15  eAssessment landing page copy and paste restriction, cropped to the relevant paragraph."),

    ("Translation software contradiction",
     "A Closed Book + SPI exam prohibits in-line translation software and browser translation extensions, then states elsewhere on "
     "the same page that a word may be typed into a translation website or external application to confirm its meaning.",
     "All Match but Escalation Required.",
     "The sources agree with each other, but the exam page contradicts itself. A student cannot follow both sentences. Record both "
     "quotes in Comments so the faculty can be given the exact wording.",
     "SS-16  The two contradictory sentences from the same landing page."),

    ("Two shells, two sets of materials",
     "The Australian and Malaysian sittings of the same unit have different authorised materials, or a unit has two shells on "
     "eVigilation, or an AAA shell exists alongside the main cohort shell.",
     "Discrepancy if the sittings should match. Always worth recording.",
     "Check that you are reading the shell named in column A before anything else. Then compare the sittings against each other. "
     "Students in both sittings usually sit the same paper, so a difference in permitted items between them is a real problem. AAA "
     "shells are checked in the same way as the main cohort and often appear on a different date.",
     "SS-17  The QC sheet showing two shells for one unit code, Australia and Malaysia."),

    ("Unit missing from eVigilation",
     "The unit is in the QC sheet but does not appear in eVigilation for that date.",
     "Not a discrepancy until you have checked three things.",
     "First, confirm the date filter in eVigilation is set to the exam date, since the wrong date is the most common cause. Second, "
     "check Enrolment Status (column F). Not Enrolled means the shell has not synced and will usually appear after the overnight "
     "sync. Third, check whether the unit has been changed to unsupervised, in which case it will never appear and the outcome is "
     "Unsupervised Exam. If none of those explain it and the exam is within a week, raise it with Senior Delivery.",
     "SS-18  eVigilation returning no results for a unit, with the date field visible."),

    ("Software run from a local drive",
     "The exam permits software such as Mathematica, R or Visual Studio, with wording about running it locally.",
     "Not a discrepancy.",
     "Running from the local drive means the program installed on the student's own machine rather than a browser or cloud version. "
     "Generic wording about what to do if the software does not work is standard across units that permit external software and "
     "does not need a Slack reminder.",
     ""),

    ("Notes with no container limit, or a container limit with no page limit",
     "The exam page permits, for example, one folder of printed notes with no page count, or unlimited hardcopy course notes.",
     "Not a discrepancy.",
     "The restriction is on the container, not the page count. One folder means one folder. Where notes are genuinely unlimited, "
     "it does not matter whether a student has a notebook as well as loose sheets. In-venue supervisors handle enforcement by "
     "looking out for students with an unusually large pile of notes and checking it against the restriction.",
     ""),

    ("Writing equipment with no working sheets",
     "The authorised materials permit pens and pencils, and no working or answer sheets are listed anywhere.",
     "Escalate.",
     "There is nothing for the student to write on, which usually means one of the two entries is wrong. Record both, quote them, "
     "and set All Match but Escalation Required if the sources agree with each other.",
     ""),

    ("Mobile phones",
     "The authorised materials permit a mobile phone during the assessment.",
     "Escalate, every time.",
     "Set All Match but Escalation Required if the sources agree. The exception is wording about a QR code scanner app used to "
     "photograph and upload work after the exam has finished. That is exam submission instruction rather than an authorised "
     "material, and it does not need escalating.",
     ""),
]
for name, seen, call, action, ss in _ex:
    EXAMPLES.append(dict(k="gap"))
    EXAMPLES.append(dict(k="h1", c=name))
    EXAMPLES.append(dict(k="ex_seen", b="What you see", c=seen))
    EXAMPLES.append(dict(k="ex_call", b="The call", c=call))
    EXAMPLES.append(dict(k="ex_do", b="What to do", c=action))
    if ss:
        EXAMPLES.append(dict(k="ss", c=ss))

# ---------------------------------------------------------------- 11 Escalation
ESCALATION = [
    dict(k="title", b="11", c="Escalation and reminders"),
    dict(k="sub", c="What happens after you record a problem, and how supervisor reminders are set."),
    dict(k="gap"),

    dict(k="h1", c="Who does what"),
    dict(k="thead", b="Role", c="Responsibility", d="Where"),
    dict(k="trow", b="First QC (you)",
         c="Compare the sources, set the category and outcome, and describe what you found. You never contact a faculty and never "
           "edit an exam page.",
         d="Columns G, H and I"),
    dict(k="trow", b="Second QC",
         c="Review another person's first QC, confirm or correct the outcome, and decide what goes to the faculty.",
         d="Column J"),
    dict(k="trow", b="Senior Delivery",
         c="Raise the escalation with the faculty, track it to resolution, and set supervisor reminders.",
         d="Columns J, K, L, M, N"),
    dict(k="gap"),

    dict(k="h1", c="How to write a Comment that can be actioned"),
    dict(k="body", c="Senior Delivery escalates from what you wrote. If the comment does not name the source and quote the wording, "
                     "someone has to redo your check before they can raise it."),
    dict(k="thead", b="Instead of", c="Write", d=""),
    dict(k="trow", b="Notes discrepancy",
         c="eVig Notes: None. eA authorised materials: \"Notes - Double sided A4 x 1 - Physical Only\". Other field on eVig is "
           "populated, which is the likely cause.", d=""),
    dict(k="trow", b="Calculator does not match",
         c="eA: physical calculator only. eVig Calculator: Physical Calculator. Lookup card: \"faculty approved calculator\". "
           "Lookup wording needs confirming.", d=""),
    dict(k="trow", b="Weird instructions",
         c="eA Instructions prohibits browser translation extensions, then states \"To confirm the meaning of a word it must be "
           "typed into a translation website or external application\". Contradictory.", d=""),
    dict(k="gap"),

    dict(k="h1", c="Where escalations go"),
    dict(k="body", c="Once a discrepancy has been through a second QC and is confirmed, Senior Delivery raises it in the "
                     "#oasis-authorised-materials Slack channel. Include everything from every source, so the thread carries the "
                     "full picture without anyone reopening the platforms. Direct all authorised materials questions to that "
                     "channel rather than to individuals."),
    dict(k="ss", c="SS-19  An example escalation post in #oasis-authorised-materials."),
    dict(k="gap"),

    dict(k="h1", c="Supervisor reminders"),
    dict(k="body", c="Two situations always need a reminder scheduled in the #delivery-reminders Slack channel, timed for one hour "
                     "before the first stagger start. A 9am exam gets an 8am reminder."),
    dict(k="thead", b="Trigger", c="Message", d=""),
    dict(k="trow", b="Open Access with Additional Device",
         c="@here :page_with_curl: Please note: For unit [UNITCODE], the authorised material is OPEN ACCESS with ADDITIONAL DEVICE. "
           "The additional device can be a laptop or tablet but not a phone :computer:", d=""),
    dict(k="trow", b="Generative AI permitted",
         c="@here Please note that unit [UNITCODE] permits the use of generative artificial intelligence (AI) (e.g. ChatGPT, GPT-3, "
           "OpenAI) as an authorised material to complete the assessment. Note that this exception applies to this unit alone. Use "
           "of generative AI for other units is not permitted. :robot_face:", d=""),
    dict(k="body", c="Your part is to make sure the unit is identifiable. Record the additional device wording in Comments for "
                     "device units, and the exact string \"Gen AI\" for AI units. Both feed the QC Overview tab, which is where "
                     "Senior Delivery finds the units needing a reminder. Column K marks a reminder as required and column N marks "
                     "it as set. Both belong to Senior Delivery."),
    dict(k="note", c="Where several units in the same session need the same reminder, they are usually combined into one message "
                     "rather than posted separately. Senior Delivery makes that call."),
    dict(k="ss", c="SS-20  A scheduled reminder in #delivery-reminders."),
]

# ---------------------------------------------------------------- 12 Timeline
TIMELINE = [
    dict(k="title", b="12", c="Timeline and second QC"),
    dict(k="sub", c="When QC happens, when to chase, and how the second pass works."),
    dict(k="gap"),

    dict(k="h1", c="When to QC a unit"),
    dict(k="thead", b="Stage", c="What it means for you", d=""),
    dict(k="trow", b="Shell built, Not Enrolled",
         c="Not ready. Leave columns G, H and I blank. Do not record a discrepancy and do not open the platforms.", d=""),
    dict(k="trow", b="Enrolled and Synced",
         c="Ready to QC. This is the trigger. Work through units in Start Time order.", d=""),
    dict(k="trow", b="First QC recorded",
         c="Category, outcome and any comments are in. The unit is now visible to Senior Delivery through the QC Overview tab.", d=""),
    dict(k="trow", b="Second QC recorded",
         c="Column J is set. Either the unit is complete, or it is with the faculty.", d=""),
    dict(k="gap"),

    dict(k="h1", c="The one week rule"),
    dict(k="body", c="Raise these with Senior Delivery. Do not wait for someone to notice."),
    dict(k="rule", b="1", c="A unit with no First QC Outcome and an exam date within a week."),
    dict(k="rule", b="2", c="A unit marked Discrepancy or All Match but Escalation Required that has not moved, with an exam date "
                            "within a week."),
    dict(k="rule", b="3", c="A unit still reading Not Enrolled with an exam date within a week. The shell has not synced and "
                            "someone needs to chase it."),
    dict(k="body", c="Start QC early enough that the second pass fits before the assessments begin. A first QC completed the day "
                     "before an exam leaves no room to escalate anything it finds."),
    dict(k="gap"),

    dict(k="h1", c="Second QC"),
    dict(k="thead", b="Rule", c="Detail", d=""),
    dict(k="trow", b="Every discrepancy gets a second QC",
         c="Any unit marked Discrepancy or All Match but Escalation Required is reviewed before it goes to a faculty.", d=""),
    dict(k="trow", b="Spot check the rest",
         c="Roughly 10 to 15 per cent of clean first QCs are re-checked by a second person, weighted towards Closed Book + SPI "
           "units. That category has the most individually listed items, so it carries the most risk.", d=""),
    dict(k="trow", b="Never second QC your own work",
         c="The second pass exists to catch what the first person missed. Reviewing your own check does not do that.", d=""),
    dict(k="trow", b="Record the result in column J",
         c="QC Complete or Escalation Required. Senior Delivery owns this column.", d=""),
    dict(k="gap"),

    dict(k="h1", c="Keeping up with late additions"),
    dict(k="body", c="Units are added to the QC sheet after a delivery period has started. When you finish a date, go back over it "
                     "for rows that were not there when you filtered. The Enrolled and Synced Shells tab and the QC Overview tab "
                     "both surface units that still need a first QC."),
]

# ---------------------------------------------------------------- 13 Quick checklist
CHECKLIST = [
    dict(k="title", b="13", c="Quick checklist"),
    dict(k="sub", c="The full sequence on one screen, for once you know the process. Every step points at the tab that explains it."),
    dict(k="gap"),

    dict(k="h1", c="End of semester. Three sources."),
    dict(k="body", c="Semester 1 and Semester 2 main exam periods. Full detail on the Process A tab."),
    dict(k="thead", b="Step", c="Action", d="Read more"),
    dict(k="crow", b="1", c="Filter the QC sheet to one exam date using Start Time (column E) and sort column A A to Z.", d="Process A"),
    dict(k="crow", b="2", c="Confirm Enrolment Status (column F) reads Enrolled and Synced. If it reads Not Enrolled, skip the "
                            "unit and leave G, H and I blank.", d="Timeline"),
    dict(k="crow", b="3", c="Open eAssessment from the link in column B. Confirm the shell matches column A, then read the "
                            "Instructions section and the Authorised Materials section.", d="The three sources"),
    dict(k="crow", b="4", c="Open eVigilation, go to Exam sessions, set the date to the exam date, set Search by to Exam unit, "
                            "search the unit code, then click the information icon to open the Authorised Materials panel.",
         d="The three sources"),
    dict(k="crow", b="5", c="Open the Lookup Tool, set the date filter to the exam date, search the unit code and read the unit card.",
         d="The three sources"),
    dict(k="crow", b="6", c="Compare the sources field by field: category, calculator, dictionary, notes, textbook, working sheets, "
                            "other and permitted items, additional device, generative AI, hybrid flag, and any restrictions in "
                            "Instructions.", d="What to compare"),
    dict(k="crow", b="7", c="Set Auth Mat Category (column G).", d="Auth Mat categories"),
    dict(k="crow", b="8", c="Set First QC Outcome (column H).", d="QC outcomes"),
    dict(k="crow", b="9", c="Record anything that is not a clean match in Comments (column I), naming each source and quoting its "
                            "wording.", d="Escalation and reminders"),
    dict(k="crow", b="10", c="Flag reminder units: Open Access with Additional Device, and any unit permitting generative AI, using "
                             "the exact string Gen AI.", d="Escalation and reminders"),
    dict(k="gap"),

    dict(k="h1", c="All other deliveries. Two sources."),
    dict(k="body", c="In-semester, Deferred and Supplementary, Rescheduled Deferred, Monash College and external client exams. Full "
                     "detail on the Process B tab."),
    dict(k="thead", b="Step", c="Action", d="Read more"),
    dict(k="crow", b="1", c="Filter the QC sheet to one exam date using Start Time (column E) and sort column A A to Z.", d="Process B"),
    dict(k="crow", b="2", c="Confirm Enrolment Status (column F) reads Enrolled and Synced.", d="Timeline"),
    dict(k="crow", b="3", c="Open eAssessment from the link in column B. Confirm the shell matches column A, including the sitting "
                            "and cohort, then read the Instructions section and the Authorised Materials section.",
         d="The three sources"),
    dict(k="crow", b="4", c="Open eVigilation, go to Exam sessions, set the date, search by Exam unit, and open the Authorised "
                            "Materials panel from the information icon.", d="The three sources"),
    dict(k="crow", b="5", c="Compare the two sources field by field.", d="What to compare"),
    dict(k="crow", b="6", c="Set Auth Mat Category (column G) and First QC Outcome (column H).", d="QC outcomes"),
    dict(k="crow", b="7", c="Record anything that is not a clean match in Comments (column I).", d="Escalation and reminders"),
    dict(k="crow", b="8", c="Flag reminder units.", d="Escalation and reminders"),
    dict(k="note", c="Do not open the Lookup Tool for these deliveries, and never record a discrepancy because a unit is absent "
                     "from it."),
    dict(k="gap"),

    dict(k="h1", c="Before you close the sheet"),
    dict(k="crow", b="", c="Check for units added since you filtered the date.", d="Timeline"),
    dict(k="crow", b="", c="Raise anything unchecked, unresolved or still Not Enrolled with an exam date inside a week.", d="Timeline"),
    dict(k="crow", b="", c="Leave nothing marked Discrepancy without a Comment that names the sources and quotes them.",
         d="Escalation and reminders"),
]

# ---------------------------------------------------------------- 14 Screenshots
SCREENSHOTS = [
    dict(k="title", b="14", c="Screenshots to add"),
    dict(k="sub", c="This document is written with screenshot placeholders in place. Capture each one, then insert it into the "
                    "placeholder row it is named in."),
    dict(k="gap"),
    dict(k="body", c="Insert with Insert, Image, Image in cell so the screenshot sits in the placeholder row and moves with it. "
                     "Crop tightly to the part of the interface being described. A full dashboard screenshot is harder to read than "
                     "a cropped panel, and it dates faster. Annotate with a single coloured box or arrow where the text refers to a "
                     "specific field. Use the same annotation colour throughout."),
    dict(k="gap"),
    dict(k="thead", b="Ref", c="What to capture", d="Appears on"),
]
_ss = [
    ("SS-01", "eAssessment exam landing page, showing the Instructions section and the Authorised Materials section. Annotate both "
              "section headings.", "The three sources, Process A, Process B"),
    ("SS-02", "eVigilation Exam sessions search panel. Annotate Select a date and Search by. Crop to the search panel only.",
     "The three sources, Process A, Process B"),
    ("SS-03", "eVigilation Authorised Materials panel opened from the information icon. Show the full field list including the "
              "Hybrid flag at the bottom.", "The three sources, Process A, Process B"),
    ("SS-04", "Lookup Tool search with the date filter set and a unit card open. Annotate the date filter.",
     "The three sources, Process A"),
    ("SS-05", "Open Access with Additional Device, side by side. The eAssessment Instructions section stating the device, next to "
              "the eVigilation panel where it does not appear.", "Auth Mat categories"),
    ("SS-06", "The QC sheet with columns A to N visible and columns G, H and I highlighted.", "QC sheet columns"),
    ("SS-07", "The QC Overview tab, showing all five lists.", "QC sheet columns"),
    ("SS-08", "eAssessment Instructions section stating an additional device, cropped to the sentence.", "Examples bank"),
    ("SS-09", "eAssessment Instructions section permitting generative AI, with the QC sheet Comments cell showing Gen AI recorded.",
     "Examples bank"),
    ("SS-10", "Working sheets, three way crop: eVigilation Yes, Lookup Tool 99, eAssessment 5 answer sheets.", "Examples bank"),
    ("SS-11", "eVigilation panel with Notes None and Other populated, next to the eAssessment page permitting notes.",
     "Examples bank"),
    ("SS-12", "The two notes wordings side by side: the eVigilation dropdown value and the eAssessment free text.", "Examples bank"),
    ("SS-13", "eAssessment authorised materials showing a physical calculator and Excel listed under Other.", "Examples bank"),
    ("SS-14", "Formula sheets: an in-exam formula sheet image, and a linked formula sheet listed in authorised materials.",
     "Examples bank"),
    ("SS-15", "eAssessment landing page copy and paste restriction, cropped to the paragraph.", "Examples bank"),
    ("SS-16", "The two contradictory translation sentences from the same landing page.", "Examples bank"),
    ("SS-17", "The QC sheet showing two shells for one unit code, an Australian and a Malaysian sitting.", "Examples bank"),
    ("SS-18", "eVigilation returning no results for a unit, with the date field visible.", "Examples bank"),
    ("SS-19", "An example escalation post in #oasis-authorised-materials.", "Escalation and reminders"),
    ("SS-20", "A scheduled reminder in #delivery-reminders.", "Escalation and reminders"),
]
for r, w, a in _ss:
    SCREENSHOTS.append(dict(k="trow", b=r, c=w, d=a))
SCREENSHOTS.append(dict(k="gap"))
SCREENSHOTS.append(dict(k="note", c="Do not use a screenshot that contains student names or student ID numbers. Crop them out or "
                                    "use a unit with no enrolments visible."))

TABS = [
    ("01 Start here", START),
    ("02 Glossary", GLOSSARY),
    ("03 The three sources", SOURCES),
    ("04 Auth Mat categories", CATEGORIES),
    ("05 QC outcomes", OUTCOMES),
    ("06 QC sheet columns", COLUMNS),
    ("07 Process A - End of semester", PROCESS_A),
    ("08 Process B - Other deliveries", PROCESS_B),
    ("09 What to compare", COMPARE),
    ("10 Examples bank", EXAMPLES),
    ("11 Escalation and reminders", ESCALATION),
    ("12 Timeline and second QC", TIMELINE),
    ("13 Quick checklist", CHECKLIST),
    ("14 Screenshots to add", SCREENSHOTS),
]
