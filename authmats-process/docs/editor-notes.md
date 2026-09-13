# Authorised Materials QC — editor notes

Document maintenance for the Authorised Materials QC training page. This is not
learner-facing. It was section 13 of the guide until the editorial pass of
10 September 2026, which moved it here so the page carries training content only.

The guide now runs 12 numbered training sections plus its completion area.

## Screenshots already on the page

| Ref | What it shows | Section |
|-----|---------------|---------|
| FIG 1 | eAssessment **Instructions** section. Numbered permitted materials, plus a secondary device restriction. | 3 |
| FIG 2 | eAssessment **Authorised Materials** section on an open book unit. | 3 |
| FIG 3 | eVigilation Exam sessions search, and the Authorised Materials panel with the full field list and the Hybrid flag. | 3 |
| FIG 4 | The Authorised Materials Search card for the same unit as FIG 3. | 3 |
| FIG 5 | The First QC Outcome column in use, with a Discrepancy among the matches. | 5 |
| FIG 6 | The QC sheet, all columns. | 6 |

## Still to capture

Four gaps remain. Each one shows something the words cannot: a screen you have to
navigate to, or two things that only make sense side by side. The worked examples
in section 9 quote the wording being compared, so they do not need pictures.

Placeholders for these were removed from the learner page in the same pass. Add
the figure back into the section named below when the capture exists.

| Ref | What to capture | Goes in section |
|-----|-----------------|-----------------|
| SS-05 | An Open Access with Additional Device unit, side by side: eAssessment Instructions stating the device, and the eVigilation panel where it does not appear. | 4, after the category table and the Monash College note |
| SS-07 | The QC Overview tab showing all five lists: First QC Required, Outstanding Issues not escalated, Reminder required but not set, Open Access with Additional Device, AI Permitted Assessments. | 6, after FIG 6 |
| SS-19 | An escalation post in `#oasis-authorised-materials`, as an example of how much context to include. | 10, under "Where escalations go" |
| SS-20 | A scheduled reminder in `#delivery-reminders`, showing the timing. | 10, at the end of "Supervisor reminders" |

## If you are capturing one

Crop tightly to the part of the interface being described. A full dashboard is
harder to read than a cropped panel, and it dates faster. Annotate with a single
coloured box or arrow where the text refers to a specific field, and keep the
same annotation colour throughout.

### Before you capture

Do not use a screenshot that contains student names or student ID numbers. Crop
them out, or use a unit with no enrolments visible. Unit codes and exam dates are
fine.

## How a figure is added to the page

Figures are embedded directly in `site-e.html` as base64 data URIs, so the page
stays a single file with no external requests. The markup pattern, inside the
step or section where the figure belongs:

```html
<figure class="shot filled wide">
  <img src="data:image/png;base64,..." alt="Plain description of what the screen shows, for screen readers." loading="lazy">
  <figcaption>
    <span class="ref">SS-05</span>
    <span>Caption naming the screen and the detail to notice.</span>
  </figcaption>
</figure>
```

Use `wide` for a full-width interface capture and `narrow` for a cropped panel.
The alternative text is accessibility content, not a duplicate of the caption:
describe what is on screen, not what the reader should conclude from it.

Rebuild with `python3 mk.py` for the standalone preview, and
`python3 make_appsscript.py` for `appsscript/Index.html`.

---

# Decisions needed from the process owner

Added by the content and training-readiness revision of 11 September 2026. Each
item changes an instruction or a scored answer in the learner guide, so the
guide should not be described as finished until they are settled.

Sources consulted: `kayla_process.txt`, `kaylas_process.xlsx` (Process, Legend -
QC Outcomes, Legend - Categories, Sheet columns), `content.py`,
`appsscript/Code.gs`. Nothing below could be answered from those.

## 1. Two addresses for the Lookup Tool

`kayla_process.txt` gives `authmats.evigilation.monash.edu`. `content.py` gives
`https://sites.google.com/monash.edu/exam-authorised-materials`. The guide uses
the first, because it is the process owner's own wording, and does not link the
second. **Which is current?**

## 2. Answer sheet counts: where are they actually read?

`kayla_process.txt` says "Answer Sheets Discrepancy | Does the number of eVig
match the number on eAssessment, flag a discrepancy if not", which implies
eVigilation carries an answer sheet *number*. The guide describes eVigilation as
carrying a Hybrid yes/no flag and no count. Both cannot be right. Section 8 now
says a yes/no flag is not a count and cannot agree or disagree with one.
**Where does a checker read comparable answer sheet counts in each source?**

## 3. Column C, and which rows a checker may take

Column C does not appear in the authoritative column reference at all, yet the
guide documents `04.Handed over for QC` as its meaningful value.
- Is `04.Handed over for QC` in column C **required** alongside `Enrolled and
  Synced` in column F, or is F sufficient?
- **Who assigns** a checker their rows or dates? Section 7 currently tells the
  reader to ask, because no rule exists to state.
- What should a checker do with a row that **already has** G, H or I filled in?
  Section 7 currently says stop and ask.
- How is a **recheck** recorded, as distinct from a first check?

## 4. Outcome precedence

Where a unit has both a discrepancy between sources and a condition needing a
faculty decision, column H takes one value. Section 5 now carries a "Not yet
settled" note rather than inventing a rule. **Which value wins?**

## 5. Open Book with Additional Device, internet access

`kaylas_process.xlsx` (Legend - Categories) says "In most cases this secondary
device is not connected to the internet and can only access soft copy
resources". Section 4 matches that. Worked case 1 previously said it "may not be
connected", which is stronger, and has been corrected. **"In most cases" leaves
the checker without a test: when is a connected device under Open Book a finding
rather than a variation?**

## 6. Differences between sittings and cohorts

Section 3 says sittings can legitimately differ and each shell is checked
independently. Section 7's path B says a difference between sittings is worth
recording even where each is internally consistent. Case 11 now scores only the
unambiguous half (an AAA shell existing is not itself a discrepancy) and carries
the open question in its explanation. **Is a material difference between two
sittings a Discrepancy, a Comment on an otherwise matching row, or neither?**

## 7. Conventions the guide cannot confirm

Each of these was being taught as a rule and is now described as undefined:
- **"Open notes" in Nursing units.** Is there a documented faculty convention,
  and where can a checker read it? Case 6 is now unscored.
- **Excel.** May students use pre-existing content in their own workbooks, or
  must they start from a blank one? Case 7 no longer teaches either reading.
- **Printed formula sheets.** Do they count against a permitted notes limit?

## 8. Escalation and reminder triggers

`kaylas_process.xlsx` (Sheet columns) marks both of these "TEAM TO CONFIRM" in
the source itself: column K Reminder Required, and column L Escalated?. The same
tab flags that the First QC Outcome value list may be incomplete. **Confirm all
three.**

## 9. Timing and help routes

- Case 12 previously said to raise an unexplained missing unit "if the exam is
  within a week". That was the only timing figure in the guide and no source
  supports it, so it has been removed. **Is there an agreed threshold?**
- Section 11 says start early enough that both passes fit. **Is there a target
  date relative to the exam?**

## 10. Practice before live work

The completion panel now says to ask Senior Delivery what to do before a first
live row, because no required practice exercise is documented. **Is there an
assigned practice exam, or a requirement that a first check be reviewed before
it counts?**

## 11. Access prerequisites

No source lists what accounts or permissions a new checker needs before day one
(eAssessment, eVigilation, the Lookup Tool, edit access to the QC sheet, Slack
channels). The guide links the four systems but cannot tell a newcomer how to
get in. **What is the access request route?**

## 12. Worksheet tab name

The QC sheet link carries `gid=533733026` but no tab name, so the guide cannot
say "open the X tab". **What is it called?**

## 13. eAssessment contradicting itself

Section 8's first row calls a page that contradicts itself "a discrepancy on its
own". Case 10's earlier version treated the same situation as All Match but
Escalation Required. The scored case has been rewritten to a source-against-
source disagreement to avoid the clash. **Which outcome applies when one source
contradicts itself and the other sources agree?**
